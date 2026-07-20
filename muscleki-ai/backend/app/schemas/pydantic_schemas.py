from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserProfileUpdate(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    fitness_goal: str  # 'lose', 'maintain', 'gain'
    preferred_region: str  # 'IN', 'US', 'ASIA', 'EU' or 'EUROPE'

class UserResponse(UserBase):
    id: int
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    fitness_goal: Optional[str] = None
    preferred_region: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True  # Backward compatibility with Pydantic v1


# --- WORKOUT SCHEMAS ---
class WorkoutBase(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_time: datetime
    status: Optional[str] = "scheduled"

class WorkoutCreate(WorkoutBase):
    phone_number: Optional[str] = None
    reminder_offset_minutes: Optional[int] = 15

class WorkoutUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    status: Optional[str] = None

class WorkoutResponse(WorkoutBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
        orm_mode = True


# --- CALENDAR TOKEN SCHEMAS ---
class CalendarTokenBase(BaseModel):
    provider: str  # google or outlook
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: datetime

class CalendarTokenCreate(CalendarTokenBase):
    user_id: int

class CalendarTokenResponse(CalendarTokenBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
        orm_mode = True


# --- REMINDER SCHEMAS ---
class ReminderBase(BaseModel):
    phone_number: str
    trigger_time: datetime
    status: Optional[str] = "pending"

class ReminderCreate(ReminderBase):
    workout_id: int

class ReminderUpdate(BaseModel):
    phone_number: Optional[str] = None
    trigger_time: Optional[datetime] = None
    status: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: int
    workout_id: int

    class Config:
        from_attributes = True
        orm_mode = True


# --- FOOD LOG SCHEMAS ---
class FoodLogBase(BaseModel):
    food_name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    fluid_volume_ml: Optional[int] = None

class FoodLogCreate(FoodLogBase):
    user_id: int

class FoodLogResponse(FoodLogBase):
    id: int
    user_id: int
    scanned_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True

# --- HYDRATION LOG SCHEMAS ---
class HydrationLogBase(BaseModel):
    fluid_type: str
    volume_ml: int
    calories_added: int = 0

class HydrationLogCreate(HydrationLogBase):
    user_id: int

class HydrationLogResponse(HydrationLogBase):
    id: int
    user_id: int
    logged_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True


# --- FORM ANALYSIS SCHEMAS ---
class FormAnalysisBase(BaseModel):
    exercise_type: str
    feedback_notes: str
    status: str # 'good', 'needs_adjustment'

class FormAnalysisCreate(FormAnalysisBase):
    user_id: int

class FormAnalysisResponse(FormAnalysisBase):
    id: int
    user_id: int
    analyzed_at: datetime

    class Config:
        from_attributes = True
        orm_mode = True


# --- LEADERBOARD SCHEMAS ---
class LeaderboardStreakBase(BaseModel):
    username: str
    daily_streak: int
    total_calories: int
    region: str

class LeaderboardStreakCreate(LeaderboardStreakBase):
    pass

class LeaderboardStreakResponse(LeaderboardStreakBase):
    id: int

    class Config:
        from_attributes = True
        orm_mode = True


