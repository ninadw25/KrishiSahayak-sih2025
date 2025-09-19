#!/usr/bin/env python3
"""
GenAI Service - Crop Recommendation API
FastAPI service that provides crop recommendations
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sys
import os
from pathlib import Path

# Add the engines directory to Python path
current_dir = Path(__file__).parent
engines_dir = current_dir / "engines"
sys.path.insert(0, str(engines_dir))

# Import the crop recommendation system
from crop_recommendation import CropRecommendationSystem

app = FastAPI(
    title="Crop Recommendation API",
    description="AI-powered crop recommendations based on weather, soil, and location data",
    version="2.0.0"
)

# Initialize the recommendation system
recommendation_system = CropRecommendationSystem()

class LocationRequest(BaseModel):
    location: str
    
class RecommendationResponse(BaseModel):
    status: str
    data: Optional[Dict[Any, Any]] = None
    message: Optional[str] = None

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Crop Recommendation API",
        "version": "2.0.0",
        "status": "running",
        "database": "NONE - Local CSV files only",
        "complexity": "MINIMAL"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        status = recommendation_system.get_system_status()
        return {
            "status": "healthy",
            "system": status
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_crop_recommendations(request: LocationRequest):
    """Get crop recommendations for a location"""
    try:
        if not request.location or not request.location.strip():
            raise HTTPException(status_code=400, detail="Location is required")
        
        result = recommendation_system.get_recommendations(request.location.strip())
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
        
        return RecommendationResponse(
            status="success",
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/status")
async def get_system_status():
    """Get detailed system status"""
    try:
        return recommendation_system.get_system_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting system status: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("🌾 Starting Crop Recommendation API...")
    print("📍 Local CSV files only - No database required")
    print("🚀 Access API at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
