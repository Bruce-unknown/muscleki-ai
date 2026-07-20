import os

class Settings:
    PROJECT_NAME: str = "Muscleki AI"
    PROJECT_VERSION: str = "1.0.0"
    
    # Simple placeholder credentials for mock validation
    SECRET_KEY: str = os.getenv("SECRET_KEY", "muscleki-ai-super-secret-key-12345")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Google Calendar Integration (OAuth2 credentials)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "MOCK_GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "MOCK_GOOGLE_SECRET")

    # Microsoft Outlook Calendar Integration (OAuth2 credentials)
    MICROSOFT_CLIENT_ID: str = os.getenv("MICROSOFT_CLIENT_ID", "MOCK_MICROSOFT_CLIENT_ID")
    MICROSOFT_CLIENT_SECRET: str = os.getenv("MICROSOFT_CLIENT_SECRET", "MOCK_MICROSOFT_SECRET")

    # Twilio Telephony Integration (SMS & Voice alerts)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "MOCK_TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "MOCK_TWILIO_KEY")
    TWILIO_FROM_NUMBER: str = os.getenv("TWILIO_FROM_NUMBER", "+15555555555")

settings = Settings()
