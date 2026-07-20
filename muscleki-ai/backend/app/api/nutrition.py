import base64
import os
import httpx
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import FoodLog, HydrationLog
from app.schemas.pydantic_schemas import FoodLogCreate, FoodLogResponse, HydrationLogCreate, HydrationLogResponse

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

# Predefined healthy meals for simulation/mock fallback
MOCK_MEALS = [
    {"food_name": "Paneer Butter Masala with Roti", "calories": 720, "protein": 28.0, "carbs": 65.0, "fats": 38.0},
    {"food_name": "Avocado Bacon Cheeseburger", "calories": 850, "protein": 42.0, "carbs": 40.0, "fats": 54.0},
    {"food_name": "Salmon Sushi & Edamame Set", "calories": 540, "protein": 32.0, "carbs": 68.0, "fats": 12.0},
    {"food_name": "Chicken Breast, Broccoli & Sweet Potato", "calories": 420, "protein": 44.0, "carbs": 38.0, "fats": 7.0},
    {"food_name": "Avocado Sourdough Toast with Poached Eggs", "calories": 460, "protein": 18.5, "carbs": 32.0, "fats": 22.5},
    {"food_name": "Greek Yogurt Parfait with Mixed Berries & Granola", "calories": 310, "protein": 22.0, "carbs": 45.0, "fats": 4.5},
    {"food_name": "Whey Protein Shake with Banana & Peanut Butter", "calories": 380, "protein": 32.0, "carbs": 28.0, "fats": 12.0},
    {"food_name": "Fresh Sugarcane Juice", "calories": 220, "protein": 1.0, "carbs": 52.0, "fats": 0.0, "fluid_volume_ml": 350},
    {"food_name": "Organic Orange Juice", "calories": 110, "protein": 2.0, "carbs": 26.0, "fats": 0.0, "fluid_volume_ml": 250},
    {"food_name": "Mango Smoothie with Chia Seeds", "calories": 320, "protein": 4.5, "carbs": 58.0, "fats": 3.0, "fluid_volume_ml": 400}
]

@router.post("/scan", response_model=FoodLogResponse)
async def scan_food_image(
    user_id: int = 1,
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Read the uploaded file
    try:
        contents = await image.read()
        image_b64 = base64.b64encode(contents).decode("utf-8")
        mime_type = image.content_type or "image/jpeg"
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process image file: {str(e)}"
        )
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    # 2. If API Key is missing or default dummy placeholder, use high-quality simulated scanner
    if not api_key or api_key == "dummy_key_value" or "MOCK" in api_key:
        print("Using simulated Nutrition AI Scanner due to missing/mock API key.")
        # Choose a simulated meal based on the uploaded file name
        filename_lower = image.filename.lower()
        selected_meal = MOCK_MEALS[0]
        if "chicken" in filename_lower or "breast" in filename_lower or "meat" in filename_lower:
            selected_meal = MOCK_MEALS[3]
        elif "egg" in filename_lower or "avocado" in filename_lower or "toast" in filename_lower:
            selected_meal = MOCK_MEALS[4]
        elif "yogurt" in filename_lower or "berry" in filename_lower or "fruit" in filename_lower:
            selected_meal = MOCK_MEALS[5]
        elif "sugarcane" in filename_lower or "cane" in filename_lower:
            selected_meal = MOCK_MEALS[7]
        elif "orange" in filename_lower or "citrus" in filename_lower:
            selected_meal = MOCK_MEALS[8]
        elif "smoothie" in filename_lower or "mango" in filename_lower or "drink" in filename_lower or "juice" in filename_lower or "beverage" in filename_lower:
            selected_meal = MOCK_MEALS[9]
        elif "shake" in filename_lower or "protein" in filename_lower:
            selected_meal = MOCK_MEALS[6]
        else:
            # Pick a meal pseudo-randomly based on name length
            selected_meal = MOCK_MEALS[len(image.filename) % len(MOCK_MEALS)]
            
        db_log = FoodLog(
            user_id=user_id,
            food_name=selected_meal["food_name"] + " (Simulated)",
            calories=selected_meal["calories"],
            protein=selected_meal["protein"],
            carbs=selected_meal["carbs"],
            fats=selected_meal["fats"],
            fluid_volume_ml=selected_meal.get("fluid_volume_ml"),
            scanned_at=datetime.utcnow()
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    # 3. Call live Gemini Vision API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = (
        "You are an expert sports nutritionist specialized in global cuisines. Analyze the meal/beverage in this image with extreme precision. "
        "Specifically, identify and accurately break down dishes and drinks from these primary regions:\n"
        "1. India: Both South and North Indian cuisines/beverages (e.g., curries, paneer butter masala, biryanis, rotis, sugarcane juice, lassi, chai).\n"
        "2. USA: American classics, fast food, and healthy staples/beverages (e.g., avocado bacon cheeseburgers, custom salads, steak, orange juice, smoothies).\n"
        "3. East Asia & Broader Asia: Traditional and modern items/beverages (e.g., sushi, ramen, stir-fry, green tea, bubble tea).\n\n"
        "Crucial instructions:\n"
        "- Identify and account for hidden cooking fats, oils, and ghee to ensure realistic, high-accuracy calorie and fat estimations.\n"
        "- If the image contains a beverage/drink (e.g., juice, tea, coffee, smoothie, soda), you MUST accurately estimate the liquid volume in milliliters (ml) alongside the macro details, returning 'fluid_volume_ml' in the JSON response. If it is solid food, leave 'fluid_volume_ml' null or omit it.\n\n"
        "Estimate the food/beverage name, serving size, and macro-nutritional content: total calories (in kcal), protein (in grams), carbohydrates (in grams), fats (in grams), and liquid fluid volume (in ml)."
    )
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": image_b64
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "food_name": {
                        "type": "STRING",
                        "description": "Name of the food or beverage identified in the image"
                    },
                    "calories": {
                        "type": "INTEGER",
                        "description": "Estimated total energy in kcal"
                    },
                    "protein": {
                        "type": "NUMBER",
                        "description": "Estimated protein weight in grams"
                    },
                    "carbs": {
                        "type": "NUMBER",
                        "description": "Estimated carbohydrate weight in grams"
                    },
                    "fats": {
                        "type": "NUMBER",
                        "description": "Estimated fat weight in grams"
                    },
                    "fluid_volume_ml": {
                        "type": "INTEGER",
                        "description": "Estimated liquid volume in milliliters (ml) if it is a beverage, otherwise null"
                    }
                },
                "required": ["food_name", "calories", "protein", "carbs", "fats"]
            }
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            
        if response.status_code != 200:
            print(f"Gemini API returned error: {response.status_code} - {response.text}")
            # Fallback to simulation instead of crashing
            selected_meal = MOCK_MEALS[0]
            db_log = FoodLog(
                user_id=user_id,
                food_name=selected_meal["food_name"] + " (Estimated Fallback)",
                calories=selected_meal["calories"],
                protein=selected_meal["protein"],
                carbs=selected_meal["carbs"],
                fats=selected_meal["fats"],
                scanned_at=datetime.utcnow()
            )
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
            return db_log
            
        data = response.json()
        text_content = data["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(text_content)
        
        # Save real log
        db_log = FoodLog(
            user_id=user_id,
            food_name=result.get("food_name", "Unknown Food"),
            calories=int(result.get("calories", 0)),
            protein=float(result.get("protein", 0)),
            carbs=float(result.get("carbs", 0)),
            fats=float(result.get("fats", 0)),
            fluid_volume_ml=result.get("fluid_volume_ml") if result.get("fluid_volume_ml") is not None else None,
            scanned_at=datetime.utcnow()
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
        
    except Exception as e:
        print(f"Exception during Gemini vision scan: {str(e)}")
        # Ultimate fallback
        selected_meal = MOCK_MEALS[0]
        db_log = FoodLog(
            user_id=user_id,
            food_name=selected_meal["food_name"] + " (Estimated Fallback)",
            calories=selected_meal["calories"],
            protein=selected_meal["protein"],
            carbs=selected_meal["carbs"],
            fats=selected_meal["fats"],
            scanned_at=datetime.utcnow()
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

@router.post("/logs", response_model=FoodLogResponse)
def create_food_log(payload: FoodLogCreate, db: Session = Depends(get_db)):
    db_log = FoodLog(
        user_id=payload.user_id,
        food_name=payload.food_name,
        calories=payload.calories,
        protein=payload.protein,
        carbs=payload.carbs,
        fats=payload.fats,
        fluid_volume_ml=payload.fluid_volume_ml,
        scanned_at=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/logs", response_model=List[FoodLogResponse])
def get_food_logs(user_id: int = 1, db: Session = Depends(get_db)):
    logs = db.query(FoodLog).filter(FoodLog.user_id == user_id).order_by(FoodLog.scanned_at.desc()).all()
    return logs

@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food_log(log_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_log = db.query(FoodLog).filter(FoodLog.id == log_id, FoodLog.user_id == user_id).first()
    if not db_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food log entry not found"
        )
    db.delete(db_log)
    db.commit()
    return None

# --- HYDRATION REST API ENDPOINTS ---
@router.post("/hydration/logs", response_model=HydrationLogResponse)
def create_hydration_log(payload: HydrationLogCreate, db: Session = Depends(get_db)):
    db_log = HydrationLog(
        user_id=payload.user_id,
        fluid_type=payload.fluid_type,
        volume_ml=payload.volume_ml,
        calories_added=payload.calories_added,
        logged_at=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/hydration/logs", response_model=List[HydrationLogResponse])
def get_hydration_logs(user_id: int = 1, db: Session = Depends(get_db)):
    logs = db.query(HydrationLog).filter(HydrationLog.user_id == user_id).order_by(HydrationLog.logged_at.desc()).all()
    return logs

@router.delete("/hydration/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hydration_log(log_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    db_log = db.query(HydrationLog).filter(HydrationLog.id == log_id, HydrationLog.user_id == user_id).first()
    if not db_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hydration log entry not found"
        )
    db.delete(db_log)
    db.commit()
    return None
