from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models.db_models import Base

# Import Routers
from app.api.auth import router as auth_router
from app.api.scheduler import router as scheduler_router
from app.api.calendar import router as calendar_router
from app.api.outlook import router as outlook_router
from app.api.telephony import router as telephony_router
from app.api.nutrition import router as nutrition_router
from app.api.barcode import router as barcode_router

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Muscleki AI API",
    description="Backend API for Muscleki AI - Workouts, Schedules, Reminders & Calendars",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(scheduler_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(outlook_router, prefix="/api")
app.include_router(telephony_router, prefix="/api")
app.include_router(nutrition_router, prefix="/api")
app.include_router(barcode_router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "app": "Muscleki AI Backend",
        "status": "healthy",
        "documentation": "/docs"
    }
