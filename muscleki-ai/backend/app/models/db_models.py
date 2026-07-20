from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Float
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    fitness_goal = Column(String(50), nullable=True)
    preferred_region = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    calendar_tokens = relationship("CalendarToken", back_populates="user", cascade="all, delete-orphan")
    food_logs = relationship("FoodLog", back_populates="user", cascade="all, delete-orphan")
    hydration_logs = relationship("HydrationLog", back_populates="user", cascade="all, delete-orphan")
    form_analyses = relationship("FormAnalysis", back_populates="user", cascade="all, delete-orphan")



class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="scheduled", nullable=False)

    # Relationships
    user = relationship("User", back_populates="workouts")
    reminders = relationship("Reminder", back_populates="workout", cascade="all, delete-orphan")


class CalendarToken(Base):
    __tablename__ = "calendar_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # google or outlook
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    user = relationship("User", back_populates="calendar_tokens")

    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_user_provider"),
    )


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String(50), nullable=False)
    trigger_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, sent, failed

    # Relationships
    workout = relationship("Workout", back_populates="reminders")


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    food_name = Column(String(255), nullable=False)
    calories = Column(Integer, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fats = Column(Float, nullable=False)
    fluid_volume_ml = Column(Integer, nullable=True)
    scanned_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="food_logs")


class HydrationLog(Base):
    __tablename__ = "hydration_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fluid_type = Column(String(255), nullable=False)
    volume_ml = Column(Integer, nullable=False)
    calories_added = Column(Integer, default=0, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="hydration_logs")


class FormAnalysis(Base):
    __tablename__ = "form_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise_type = Column(String(100), nullable=False)
    feedback_notes = Column(Text, nullable=False)
    status = Column(String(50), nullable=False)  # 'good', 'needs_adjustment'
    analyzed_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="form_analyses")


class LeaderboardStreak(Base):
    __tablename__ = "leaderboard_streaks"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    daily_streak = Column(Integer, default=0, nullable=False)
    total_calories = Column(Integer, default=0, nullable=False)
    region = Column(String(50), nullable=False)


