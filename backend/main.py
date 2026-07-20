from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Muscleki AI API")

# Enable CORS so your frontend can talk to it safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "engine": "Autonomous Physical Scheduling Engine",
        "db_schema": "SQLITE_V3_ONLINE"
    }

@app.get("/api/routines")
def get_active_routines():
    return {
        "active_routines_count": 2,
        "completed_workouts_count": 1,
        "calendars_connected": "1/2",
        "sms_queued": 1
    }

