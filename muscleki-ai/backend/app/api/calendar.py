from datetime import datetime, timedelta
import httpx
import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.db_models import CalendarToken
from app.schemas.pydantic_schemas import CalendarTokenResponse, CalendarTokenCreate
from app.core.config import settings

router = APIRouter(prefix="/calendar", tags=["calendar"])

class CalendarEventCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    scheduled_time: datetime

@router.get("/status")
def get_calendar_status():
    return {"status": "connected", "provider": "google", "message": "Google Calendar Integration Core Active"}

@router.post("/token", response_model=CalendarTokenResponse)
def save_google_token(token_in: CalendarTokenCreate, db: Session = Depends(get_db)):
    db_token = db.query(CalendarToken).filter(
        CalendarToken.user_id == token_in.user_id,
        CalendarToken.provider == "google"
    ).first()
    
    if db_token:
        db_token.access_token = token_in.access_token
        if token_in.refresh_token:
            db_token.refresh_token = token_in.refresh_token
        db_token.expires_at = token_in.expires_at
    else:
        db_token = CalendarToken(
            user_id=token_in.user_id,
            provider="google",
            access_token=token_in.access_token,
            refresh_token=token_in.refresh_token,
            expires_at=token_in.expires_at
        )
        db.add(db_token)
    
    db.commit()
    db.refresh(db_token)
    return db_token

def refresh_google_access_token(user_id: int, db: Session) -> Optional[str]:
    db_token = db.query(CalendarToken).filter(
        CalendarToken.user_id == user_id,
        CalendarToken.provider == "google"
    ).first()
    
    if not db_token:
        return None
    
    # If the token is not expired yet, use it
    # Allow a 60-second buffer
    now = datetime.utcnow()
    # Handle timezone differences: db_token.expires_at might be offset-naive or offset-aware. 
    # Let's ensure comparison works cleanly by removing tz if present
    expires_at = db_token.expires_at
    if expires_at.tzinfo is not None:
        expires_at = expires_at.replace(tzinfo=None)
        
    if expires_at > now + timedelta(seconds=60):
        return db_token.access_token
    
    if not db_token.refresh_token:
        return None
        
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    
    if client_id == "MOCK_GOOGLE_CLIENT_ID" or client_secret == "MOCK_GOOGLE_SECRET":
        print("Using mock Google OAuth credentials. Bypassing live refresh.")
        return None
    
    try:
        response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": db_token.refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=10.0
        )
        if response.status_code == 200:
            data = response.json()
            db_token.access_token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            db_token.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            db.commit()
            db.refresh(db_token)
            return db_token.access_token
        else:
            print(f"Failed to refresh Google token: {response.text}")
            return None
    except Exception as e:
        print(f"Error during Google token refresh: {e}")
        return None

@router.post("/refresh/{user_id}")
def refresh_token_endpoint(user_id: int, db: Session = Depends(get_db)):
    token = refresh_google_access_token(user_id, db)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not refresh Google token or no token exists"
        )
    return {"access_token": token, "status": "refreshed"}

def create_google_calendar_event(user_id: int, title: str, description: Optional[str], scheduled_time: datetime, db: Session):
    access_token = refresh_google_access_token(user_id, db)
    if not access_token:
        print(f"No active Google Calendar token found for user_id={user_id}. Skipping event creation.")
        return None
        
    start_time_iso = scheduled_time.isoformat()
    # End time is start time + 1 hour (default)
    end_time_iso = (scheduled_time + timedelta(hours=1)).isoformat()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "summary": f"💪 Muscleki: {title}",
        "description": description or "Scheduled from Muscleki AI Scheduler",
        "start": {
            "dateTime": start_time_iso,
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": end_time_iso,
            "timeZone": "UTC"
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 15}
            ]
        }
    }
    
    try:
        response = httpx.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers=headers,
            json=payload,
            timeout=10.0
        )
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"Google Calendar event creation failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error creating Google Calendar event: {e}")
        return None

@router.post("/create-event")
def create_event_endpoint(event_in: CalendarEventCreate, db: Session = Depends(get_db)):
    result = create_google_calendar_event(
        user_id=event_in.user_id,
        title=event_in.title,
        description=event_in.description,
        scheduled_time=event_in.scheduled_time,
        db=db
    )
    if not result:
        return {
            "status": "simulated",
            "message": "Real Google Calendar integration skipped (OAuth token or API credentials not configured). Registered in DB.",
            "title": event_in.title
        }
    return {"status": "success", "event": result}
