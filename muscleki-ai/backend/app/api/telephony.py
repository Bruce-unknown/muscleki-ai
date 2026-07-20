import os
import httpx
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/telephony", tags=["telephony"])

class TelephonyPayload(BaseModel):
    phone_number: str
    message: str
    notification_type: Optional[str] = "sms"  # sms or voice

def send_twilio_sms(phone_number: str, message: str) -> Optional[dict]:
    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    from_number = settings.TWILIO_FROM_NUMBER
    
    if not account_sid or not auth_token or account_sid == "MOCK_TWILIO_ACCOUNT_SID" or auth_token == "MOCK_TWILIO_KEY":
        print("Twilio credentials not configured or using placeholders. Skipping live SMS dispatch.")
        return None
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    auth = (account_sid, auth_token)
    data = {
        "To": phone_number,
        "From": from_number,
        "Body": message
    }
    
    try:
        response = httpx.post(url, auth=auth, data=data, timeout=10.0)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"Twilio SMS delivery failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error dispatching Twilio SMS: {e}")
        return None

def trigger_twilio_voice_call(phone_number: str, message: str) -> Optional[dict]:
    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    from_number = settings.TWILIO_FROM_NUMBER
    
    if not account_sid or not auth_token or account_sid == "MOCK_TWILIO_ACCOUNT_SID" or auth_token == "MOCK_TWILIO_KEY":
        print("Twilio credentials not configured or using placeholders. Skipping live voice call.")
        return None
        
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json"
    auth = (account_sid, auth_token)
    
    # Simple TwiML string to read the reminder message to the user
    twiml_instruction = f"<Response><Say voice='alice'>Hello! This is your Muscleki AI autonomous reminder. {message}</Say><Pause length='1'/><Say>Good luck with your training session. Goodbye!</Say></Response>"
    
    data = {
        "To": phone_number,
        "From": from_number,
        "Twiml": twiml_instruction
    }
    
    try:
        response = httpx.post(url, auth=auth, data=data, timeout=10.0)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            print(f"Twilio Voice call failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error starting Twilio Voice call: {e}")
        return None

@router.post("/send-reminder")
def send_reminder(payload: TelephonyPayload):
    # Depending on the type, send SMS or trigger call
    if payload.notification_type == "voice":
        result = trigger_twilio_voice_call(payload.phone_number, payload.message)
    else:
        result = send_twilio_sms(payload.phone_number, payload.message)
        
    if not result:
        return {
            "status": "simulated",
            "phone_number": payload.phone_number,
            "message": payload.message,
            "notification_type": payload.notification_type or "sms",
            "detail": "Twilio parameters simulated successfully. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars for live dispatch."
        }
        
    return {
        "status": "dispatched",
        "phone_number": payload.phone_number,
        "message": payload.message,
        "notification_type": payload.notification_type or "sms",
        "provider_response": result
    }
