"""
Simple Pest Detection Routes
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import shutil
from pathlib import Path
import sys

# Add the models directory to the path
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from models.pest_detector import detect_pest, load_pesticide_recommendations, format_chat_response
from models.crop_classifier import classify_pest

router = APIRouter(prefix="/pest", tags=["Pest Detection & Crop Classification"])

# Paths configuration
ASSETS_DIR = Path(__file__).parent.parent / "assets"
IMG_DIR = ASSETS_DIR / "img"
MODEL_PATH = ASSETS_DIR / "pest_detector.pt"
CROP_MODEL_PATH = ASSETS_DIR / "crop_classifier.pt"
PESTICIDE_CSV_PATH = ASSETS_DIR / "pesticides.csv"

# Load pesticide database once when the module starts
pesticide_database = load_pesticide_recommendations(str(PESTICIDE_CSV_PATH))

@router.post("/detect")
async def detect_pest_from_image(image: UploadFile = File(...)):
    """
    Simple pest detection endpoint
    Takes an image file and returns pest detection results
    """
    try:
        # Check if image file is provided
        if not image.filename:
            raise HTTPException(status_code=400, detail="No image file provided")
        
        # Check file type (simple validation)
        allowed_types = [".jpg", ".jpeg", ".png", ".bmp"]
        file_extension = Path(image.filename).suffix.lower()
        
        if file_extension not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Use: {', '.join(allowed_types)}"
            )
        
        # Create unique filename to avoid conflicts
        import time
        timestamp = int(time.time())
        filename = f"pest_upload_{timestamp}{file_extension}"
        file_path = IMG_DIR / filename
        
        # Ensure img directory exists
        IMG_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded image to assets/img folder
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Run pest detection
        detection_results = detect_pest(
            model_path=str(MODEL_PATH),
            image_path=str(file_path),
            pesticide_db=pesticide_database
        )
        
        # Format response
        response_text = format_chat_response(detection_results)
        
        # Clean up - remove the uploaded image file (optional)
        # Uncomment the next line if you want to delete images after processing
        # file_path.unlink(missing_ok=True)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Pest detection completed successfully",
                "filename": filename,
                "detection_results": response_text,
                "raw_results": detection_results
            }
        )
        
    except Exception as e:
        # Clean up file if error occurs
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink(missing_ok=True)
            
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "Pest detection failed"
            }
        )

@router.post("/classify-crop")
async def classify_crop_from_image(image: UploadFile = File(...)):
    """
    Simple crop classification endpoint
    Takes an image file and returns crop classification results
    """
    try:
        # Check if image file is provided
        if not image.filename:
            raise HTTPException(status_code=400, detail="No image file provided")
        
        # Check file type (simple validation)
        allowed_types = [".jpg", ".jpeg", ".png", ".bmp"]
        file_extension = Path(image.filename).suffix.lower()
        
        if file_extension not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not supported. Use: {', '.join(allowed_types)}"
            )
        
        # Create unique filename to avoid conflicts
        import time
        timestamp = int(time.time())
        filename = f"crop_upload_{timestamp}{file_extension}"
        file_path = IMG_DIR / filename
        
        # Ensure img directory exists
        IMG_DIR.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded image to assets/img folder
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Run crop classification
        classification_result = classify_pest(
            model_path=str(CROP_MODEL_PATH),
            image_path=str(file_path)
        )
        
        # Clean up - remove the uploaded image file (optional)
        # Uncomment the next line if you want to delete images after processing
        # file_path.unlink(missing_ok=True)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Crop classification completed successfully",
                "filename": filename,
                "classification_result": classification_result
            }
        )
        
    except Exception as e:
        # Clean up file if error occurs
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink(missing_ok=True)
            
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "message": "Crop classification failed"
            }
        )

@router.get("/health")
async def health_check():
    """Simple health check for pest detection and crop classification services"""
    return {
        "status": "healthy",
        "services": ["pest_detection", "crop_classification"],
        "pest_model_exists": MODEL_PATH.exists(),
        "crop_model_exists": CROP_MODEL_PATH.exists(),
        "pesticide_db_loaded": len(pesticide_database) > 0
    }