#!/usr/bin/env python3
"""
Simple Tool Functions for Agricultural AI Agent
These functions mirror the endpoint logic but can be called directly by the LLM
"""

import sys
from pathlib import Path

# Add paths for imports
current_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(current_dir))

from schemas.crop_schema import CropRequest
from schemas.fertilizer_schema import FertilizerInput
from routes.crop_routes import predictor
from services.weather_service import get_weather
import pandas as pd
from models.fertilizer_model import FertilizerRecommendationSystem

# Global fertilizer system
fertilizer_system = None

def get_crop_recommendation(latitude: float, longitude: float, state: str, district: str, 
                          previous_crop: str, land_size: float, season: str, 
                          soil_ph: float, soil_moisture: float) -> dict:
    """
    Get crop recommendation based on coordinates and soil conditions
    Returns the same logic as /crop/recommend endpoint
    """
    try:
        # Get weather data
        weather_data = get_weather(latitude, longitude)
        
        if not weather_data:
            return {"error": "Could not fetch weather data"}
        
        # Extract weather info
        temperature = weather_data.get('temperature', 25.0)
        humidity = weather_data.get('humidity', 60.0)
        
        # Get crop recommendations using existing predictor
        recommendations = predictor.predict_crops(
            temp=temperature,
            humidity=humidity,
            soil_ph=soil_ph,
            soil_moisture=soil_moisture,
            season=season
        )
        
        if not recommendations:
            return {"error": "Could not generate recommendations"}
        
        # Format response
        result = {
            "success": True,
            "location": f"{district}, {state}",
            "weather": f"{temperature}°C, {humidity}% humidity",
            "best_crop": recommendations[0].crop,
            "top_recommendations": [
                {
                    "crop": rec.crop,
                    "score": rec.suitability_score,
                    "yield": rec.predicted_yield_t_per_ha,
                    "confidence": rec.confidence
                }
                for rec in recommendations[:3]  # Top 3
            ]
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Crop recommendation failed: {str(e)}"}


def get_fertilizer_recommendation(crop: str, N: float, P: float, K: float, ph: float) -> dict:
    """
    Get fertilizer recommendation for given crop and soil conditions
    Returns the same logic as /fertilizer_recommender endpoint
    """
    global fertilizer_system
    
    try:
        # Initialize fertilizer system if needed
        if fertilizer_system is None:
            data_dir = current_dir.parent / "data" / "ML"
            csv_path = data_dir / "fertilizer_crop.csv"
            
            fertilizer_system = FertilizerRecommendationSystem(str(csv_path))
            crop_data = pd.read_csv(csv_path)
            fertilizer_system.train_model(crop_data)
        
        # Get recommendation
        fertilizer, dosage = fertilizer_system.recommend_fertilizer(
            N=N, P=P, K=K, ph=ph, crop=crop
        )
        
        # Get updated soil parameters
        current_soil = {'N': N, 'P': P, 'K': K, 'ph': ph}
        updated_soil = fertilizer_system.update_soil_parameters(
            current_soil=current_soil,
            fertilizer=fertilizer,
            dosage=dosage
        )
        
        result = {
            "success": True,
            "crop": crop,
            "fertilizer": fertilizer,
            "dosage": round(float(dosage), 2),
            "current_soil": {
                "N": round(N, 2),
                "P": round(P, 2), 
                "K": round(K, 2),
                "ph": round(ph, 2)
            },
            "updated_soil": {
                "N": round(float(updated_soil['N']), 2),
                "P": round(float(updated_soil['P']), 2),
                "K": round(float(updated_soil['K']), 2),
                "ph": round(float(updated_soil['ph']), 2)
            }
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Fertilizer recommendation failed: {str(e)}"}


# Tool function aliases for agent imports
def crop_recommendation_tool(latitude: float, longitude: float, state: str, district: str, 
                           previous_crop: str, land_size: float, season: str, 
                           soil_ph: float, soil_moisture: float) -> dict:
    """Tool function for crop recommendation - alias for get_crop_recommendation"""
    return get_crop_recommendation(latitude, longitude, state, district, 
                                 previous_crop, land_size, season, soil_ph, soil_moisture)


def fertilizer_recommendation_tool(crop: str, N: float, P: float, K: float, ph: float) -> dict:
    """Tool function for fertilizer recommendation - alias for get_fertilizer_recommendation"""
    return get_fertilizer_recommendation(crop, N, P, K, ph)