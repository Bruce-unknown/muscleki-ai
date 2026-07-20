from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from datetime import timedelta
from app.models.db_models import Workout, Reminder
from app.api.calendar import create_google_calendar_event
from app.api.outlook import create_outlook_calendar_event

router = APIRouter(prefix="/workouts", tags=["scheduler"])

@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(user_id: int, workout_in: WorkoutCreate, db: Session = Depends(get_db)):
    db_workout = Workout(
        user_id=user_id,
        title=workout_in.title,
        description=workout_in.description,
        scheduled_time=workout_in.scheduled_time,
        status=workout_in.status or "scheduled"
    )
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)

    # 1. Automatically attempt to log the calendar event for Google & Microsoft Graph Calendars
    try:
        create_google_calendar_event(
            user_id=user_id,
            title=workout_in.title,
            description=workout_in.description,
            scheduled_time=workout_in.scheduled_time,
            db=db
        )
    except Exception as e:
        print(f"Failed to auto-log Google calendar event: {e}")

    try:
        create_outlook_calendar_event(
            user_id=user_id,
            title=workout_in.title,
            description=workout_in.description,
            scheduled_time=workout_in.scheduled_time,
            db=db
        )
    except Exception as e:
        print(f"Failed to auto-log Microsoft Outlook calendar event: {e}")

    # 2. Automatically queue a 15-minute pending reminder
    try:
        phone = workout_in.phone_number or "+1 (555) 019-2834"
        offset_mins = workout_in.reminder_offset_minutes if workout_in.reminder_offset_minutes is not None else 15
        
        # Calculate when to trigger: scheduled_time minus lead time
        trigger_time = workout_in.scheduled_time - timedelta(minutes=offset_mins)
        
        db_reminder = Reminder(
            workout_id=db_workout.id,
            phone_number=phone,
            trigger_time=trigger_time,
            status="pending"
        )
        db.add(db_reminder)
        db.commit()
    except Exception as e:
        print(f"Failed to auto-queue telephony reminder: {e}")

    return db_workout

@router.get("", response_model=List[WorkoutResponse])
def read_workouts(user_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Workout)
    if user_id is not None:
        query = query.filter(Workout.user_id == user_id)
    return query.offset(skip).limit(limit).all()

@router.get("/{workout_id}", response_model=WorkoutResponse)
def read_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    return workout

@router.put("/{workout_id}", response_model=WorkoutResponse)
def update_workout(workout_id: int, workout_in: WorkoutUpdate, db: Session = Depends(get_db)):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    # Update fields if provided
    update_data = workout_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(workout, key, value)
        
    db.commit()
    db.refresh(workout)
    return workout

@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    db.delete(workout)
    db.commit()
    return None
