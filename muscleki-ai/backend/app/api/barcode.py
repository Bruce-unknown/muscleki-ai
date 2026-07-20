import httpx
import re
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/barcode", tags=["barcode"])

# Static list of simulation/test barcodes as requested:
SIMULATED_PRODUCTS = {
    "8901262010115": {
        "product_name": "Amul Pasteurized Butter (India Barcode)",
        "calories": 720,
        "protein": 0.5,
        "carbs": 1.0,
        "fats": 81.0,
        "fluid_volume_ml": None
    },
    "044000032029": {
        "product_name": "Oreo Cookies Global Pack",
        "calories": 140,
        "protein": 1.0,
        "carbs": 21.0,
        "fats": 6.0,
        "fluid_volume_ml": None
    },
    "021000010830": {
        "product_name": "Tropicana 100% Orange Juice",
        "calories": 110,
        "protein": 2.0,
        "carbs": 26.0,
        "fats": 0.0,
        "fluid_volume_ml": 240
    }
}

@router.get("/scan/{barcode}")
async def scan_barcode(barcode: str):
    # First, check if the barcode is in our simulated list to guarantee correct responses
    clean_barcode = barcode.strip()
    if clean_barcode in SIMULATED_PRODUCTS:
        return {
            "status": "success",
            "source": "simulation",
            "product": SIMULATED_PRODUCTS[clean_barcode]
        }
    
    # Otherwise, perform a live Open Food Facts API fetch
    url = f"https://world.openfoodfacts.org/api/v2/product/{clean_barcode}.json"
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url, timeout=10.0)
            
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Open Food Facts API returned status code {response.status_code}"
            )
            
        data = response.json()
        if data.get("status") != 1 or "product" not in data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found in Open Food Facts database."
            )
            
        product_data = data["product"]
        
        # Parse product name
        product_name = product_data.get("product_name") or product_data.get("product_name_en") or product_data.get("product_name_fr") or "Unknown Product"
        brands = product_data.get("brands")
        if brands:
            product_name = f"{brands} - {product_name}"
            
        # Parse nutriments
        nutriments = product_data.get("nutriments", {})
        
        # Energy / Calories
        calories = nutriments.get("energy-kcal_serving") or nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal") or nutriments.get("energy-kcal_value") or 0
        try:
            calories = int(float(calories))
        except (ValueError, TypeError):
            calories = 0
            
        # Protein
        protein = nutriments.get("proteins_serving") or nutriments.get("proteins_100g") or nutriments.get("proteins") or nutriments.get("proteins_value") or 0.0
        try:
            protein = round(float(protein), 1)
        except (ValueError, TypeError):
            protein = 0.0
            
        # Carbs
        carbs = nutriments.get("carbohydrates_serving") or nutriments.get("carbohydrates_100g") or nutriments.get("carbohydrates") or nutriments.get("carbohydrates_value") or 0.0
        try:
            carbs = round(float(carbs), 1)
        except (ValueError, TypeError):
            carbs = 0.0
            
        # Fats
        fats = nutriments.get("fat_serving") or nutriments.get("fat_100g") or nutriments.get("fat") or nutriments.get("fat_value") or 0.0
        try:
            fats = round(float(fats), 1)
        except (ValueError, TypeError):
            fats = 0.0
            
        # Detect if beverage and parse fluid volume
        categories_str = str(product_data.get("categories") or "").lower()
        product_name_lower = product_name.lower()
        quantity_str = str(product_data.get("quantity") or "").lower()
        
        is_beverage = any(x in product_name_lower or x in categories_str for x in ["juice", "beverage", "drink", "milk", "water", "tea", "coffee", "soda", "shake", "smoothie"]) or "ml" in quantity_str or " l " in quantity_str or quantity_str.endswith("l")
        
        fluid_volume_ml = None
        if is_beverage:
            # Try to parse volume from quantity
            ml_match = re.search(r"(\d+(?:\.\d+)?)\s*(ml|l)", quantity_str)
            if ml_match:
                val = float(ml_match.group(1))
                unit_str = ml_match.group(2)
                if unit_str == "l":
                    fluid_volume_ml = int(val * 1000)
                else:
                    fluid_volume_ml = int(val)
            else:
                fluid_volume_ml = 250  # default portion size for scanned beverage
                
        return {
            "status": "success",
            "source": "api",
            "product": {
                "product_name": product_name,
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fats": fats,
                "fluid_volume_ml": fluid_volume_ml
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error querying barcode API: {str(e)}"
        )
