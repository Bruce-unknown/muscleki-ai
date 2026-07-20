from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    workouts = relationship("WorkoutLog", back_populates="user")

class WorkoutLog(Base):
    __tablename__ = "workout_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    routine_name = Column(String, nullable=False)
    status = Column(String, default="Scheduled")
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="workouts")
