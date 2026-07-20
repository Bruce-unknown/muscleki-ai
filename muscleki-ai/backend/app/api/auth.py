import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import User
from app.schemas.pydantic_schemas import UserCreate, UserResponse, UserProfileUpdate

router = APIRouter(prefix="/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def generate_mock_token(email: str) -> str:
    # Generates a simple, recognizable token for muscleki-ai mock JWT strategy
    expire_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
    return f"mock-jwt-token-{email}-{expire_time}"

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pwd = hash_password(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    hashed_pwd = hash_password(user_in.password)
    if db_user.hashed_password != hashed_pwd:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = generate_mock_token(db_user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email
        }
    }

@router.get("/profile")
def get_profile(user_id: int = 1, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Calculate BMR and targets
    weight = db_user.weight_kg or 70.0
    height = db_user.height_cm or 170.0
    age = db_user.age or 25
    goal = db_user.fitness_goal or "maintain"
    
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
    
    if goal == "lose":
        calories = bmr * 1.25 - 400
        protein = weight * 2.0
    elif goal == "gain":
        calories = bmr * 1.25 + 400
        protein = weight * 2.2
    else:
        calories = bmr * 1.25
        protein = weight * 1.6
        
    calories = max(round(calories), 1200)
    protein = max(round(protein), 50)
    fats = max(round((calories * 0.25) / 9), 40)
    carbs = max(round((calories - (protein * 4) - (fats * 9)) / 4), 100)
    
    water_ml = max(round((weight * 35) / 50) * 50, 2000)
    
    return {
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "weight_kg": db_user.weight_kg,
            "height_cm": db_user.height_cm,
            "age": db_user.age,
            "fitness_goal": db_user.fitness_goal,
            "preferred_region": db_user.preferred_region
        },
        "targets": {
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fats": fats,
            "water_ml": water_ml
        }
    }

@router.put("/profile")
def update_profile(profile_in: UserProfileUpdate, user_id: int = 1, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db_user.weight_kg = profile_in.weight_kg
    db_user.height_cm = profile_in.height_cm
    db_user.age = profile_in.age
    db_user.fitness_goal = profile_in.fitness_goal
    db_user.preferred_region = profile_in.preferred_region
    db.commit()
    db.refresh(db_user)
    
    # Calculate BMR and targets
    weight = db_user.weight_kg
    height = db_user.height_cm
    age = db_user.age
    goal = db_user.fitness_goal
    
    bmr = 10 * weight + 6.25 * height - 5 * age + 5
    
    if goal == "lose":
        calories = bmr * 1.25 - 400
        protein = weight * 2.0
    elif goal == "gain":
        calories = bmr * 1.25 + 400
        protein = weight * 2.2
    else:
        calories = bmr * 1.25
        protein = weight * 1.6
        
    calories = max(round(calories), 1200)
    protein = max(round(protein), 50)
    fats = max(round((calories * 0.25) / 9), 40)
    carbs = max(round((calories - (protein * 4) - (fats * 9)) / 4), 100)
    
    water_ml = max(round((weight * 35) / 50) * 50, 2000)
    
    return {
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "weight_kg": db_user.weight_kg,
            "height_cm": db_user.height_cm,
            "age": db_user.age,
            "fitness_goal": db_user.fitness_goal,
            "preferred_region": db_user.preferred_region
        },
        "targets": {
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fats": fats,
            "water_ml": water_ml
        }
    }
