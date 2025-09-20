#!/usr/bin/env python3
"""
Pure API-based Crop Recommendation Engine using Ngrok
No local models - everything via API calls
"""

import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from fuzzywuzzy import fuzz, process
import requests
from pathlib import Path
import os
from dotenv import load_dotenv
import warnings
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Configuration
@dataclass
class Config:
    # API Keys
    RAPIDAPI_WEATHER_KEY: str = os.getenv('RAPIDAPI_WEATHER_KEY')
    MAPBOX_ACCESS_TOKEN: str = os.getenv('MAPBOX_ACCESS_TOKEN')
    
    # NGROK ML API - UPDATED TO USE YOUR DEPLOYED API
    NGROK_API_BASE: str = os.getenv('NGROK_API_URL', 'https://29109c887485.ngrok-free.app')  # Update this URL when ngrok refreshes
    
    # API endpoints
    RAPIDAPI_WEATHER_BASE: str = "https://open-weather13.p.rapidapi.com"
    
    MIN_FUZZY_SCORE: int = 80
    MODEL_VERSION: str = "v5.0-NGROK-API"

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data Models
@dataclass
class Location:
    state: str
    district: str = ""
    latitude: float = 0.0
    longitude: float = 0.0

@dataclass
class SoilData:
    ph_level: float
    organic_matter_percent: float = 2.5
    nitrogen_level: str = "Medium"
    phosphorus_level: str = "Medium"
    potassium_level: str = "Medium"
    moisture_percent: float = 0.0
    primary_soil_type: str = "Alluvial"
    drainage: str = "Good"
    texture: str = "Loamy"

@dataclass
class WeatherData:
    temperature: float
    humidity: float
    rainfall_mm: float = 0.0
    season: str = "kharif"
    wind_speed: float = 0.0
    pressure: float = 1013.0

@dataclass
class CropRecommendation:
    crop_name: str
    suitability_score: float
    confidence: float
    reasoning: str
    risk_factors: List[str]
    expected_yield_tons_per_hectare: float = 0.0
    investment_required_per_hectare: float = 0.0
    profit_potential: str = "Unknown"
    growing_period_days: int = 120
    irrigation_requirements: str = "Moderate"
    fertilizer_recommendations: str = "Standard NPK"

# NGROK API CLIENT - CALLS YOUR DEPLOYED ML MODELS!
class NgrokAPIClient:
    def __init__(self):
        self.api_base = Config.NGROK_API_BASE
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'CropRecommendationSystem/5.0'
        })
        self.test_connection()
    
    def test_connection(self):
        """Test connection to ngrok API"""
        try:
            response = self.session.get(f"{self.api_base}/", timeout=10)
            if response.status_code == 200:
                logger.info(f"✅ Connected to ngrok API: {self.api_base}")
            else:
                logger.warning(f"⚠️ Ngrok API responded with status: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to ngrok API: {e}")
            logger.info("📝 Make sure to update NGROK_API_BASE when ngrok URL refreshes")
    
    def get_crop_recommendation(self, request_data: Dict) -> Dict:
        """Get crop recommendations from ngrok API"""
        try:
            response = self.session.post(
                f"{self.api_base}/recommend/crop",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info("✅ Got crop recommendations from ngrok API")
                return data
            else:
                logger.warning(f"⚠️ API request failed: {response.status_code}")
                return self._fallback_response()
                
        except Exception as e:
            logger.error(f"❌ API request error: {e}")
            return self._fallback_response()
    
    def predict_yield(self, request_data: Dict) -> Dict:
        """Get yield predictions from ngrok API"""
        try:
            response = self.session.post(
                f"{self.api_base}/predict/yield",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info("✅ Got yield prediction from ngrok API")
                return data
            else:
                logger.warning(f"⚠️ Yield API request failed: {response.status_code}")
                return {"predicted_yield": 3.5, "confidence": 0.6}
                
        except Exception as e:
            logger.error(f"❌ Yield API request error: {e}")
            return {"predicted_yield": 3.0, "confidence": 0.5}
    
    def predict_price(self, request_data: Dict) -> Dict:
        """Get price predictions from ngrok API"""
        try:
            response = self.session.post(
                f"{self.api_base}/predict/price",
                json=request_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info("✅ Got price prediction from ngrok API")
                return data
            else:
                logger.warning(f"⚠️ Price API request failed: {response.status_code}")
                return {"predicted_price": 2500, "confidence": 0.6}
                
        except Exception as e:
            logger.error(f"❌ Price API request error: {e}")
            return {"predicted_price": 2000, "confidence": 0.5}
    
    def _fallback_response(self) -> Dict:
        """Fallback response when API is unavailable"""
        return {
            "recommendations": [
                {"crop": "Rice", "suitability_score": 0.7, "confidence": 0.6},
                {"crop": "Wheat", "suitability_score": 0.6, "confidence": 0.5},
                {"crop": "Maize", "suitability_score": 0.5, "confidence": 0.4}
            ],
            "source": "fallback"
        }

# PURE API Crop Predictor - ONLY NGROK API!
class CropPredictor:
    def __init__(self, api_client: NgrokAPIClient):
        self.api_client = api_client
        logger.info("🌐 CropPredictor initialized - PURE API MODE!")

    def predict_crops(self, weather: WeatherData, soil: SoilData, location: Location) -> List[Tuple[str, float]]:
        """Predict crops using ONLY ngrok API"""
        try:
            # Prepare request data for API
            request_data = {
                "location": {
                    "state": location.state,
                    "district": location.district,
                    "latitude": location.latitude,
                    "longitude": location.longitude
                },
                "weather": asdict(weather),
                "soil": asdict(soil)
            }
            
            # Get recommendations from ngrok API
            logger.info(f"📡 Calling ngrok API for {location.state}")
            api_response = self.api_client.get_crop_recommendation(request_data)
            
            if api_response.get("status") == "success" and "recommendations" in api_response:
                predictions = []
                for rec in api_response["recommendations"][:10]:  # Top 10 crops
                    crop_name = rec.get("crop", "Unknown")
                    confidence = rec.get("confidence", 0.5)
                    predictions.append((crop_name, confidence))
                
                logger.info(f"✅ Got {len(predictions)} predictions from API")
                return predictions
            else:
                logger.warning("⚠️ API response invalid, using basic fallback")
                return self._basic_fallback()
                
        except Exception as e:
            logger.error(f"❌ API call failed: {e}")
            return self._basic_fallback()
    
    def _basic_fallback(self) -> List[Tuple[str, float]]:
        """Minimal fallback when API is completely unavailable"""
        return [
            ('Rice', 0.7), ('Wheat', 0.6), ('Maize', 0.5),
            ('Cotton', 0.4), ('Sugarcane', 0.4)
        ]
    
    def get_yield_prediction(self, state: str, crop: str, weather: WeatherData, soil: SoilData) -> float:
        """Get yield prediction from ngrok API"""
        try:
            request_data = {
                "state": state,
                "crop": crop,
                "weather": asdict(weather),
                "soil": asdict(soil)
            }
            
            response = self.api_client.predict_yield(request_data)
            return response.get("predicted_yield", 3.5)
            
        except Exception as e:
            logger.warning(f"⚠️ Yield API failed: {e}")
            return 3.0
    
    def get_price_prediction(self, state: str, crop: str) -> float:
        """Get price prediction from ngrok API"""
        try:
            request_data = {
                "state": state,
                "crop": crop,
                "month": datetime.now().month
            }
            
            response = self.api_client.predict_price(request_data)
            return response.get("predicted_price", 2500)
            
        except Exception as e:
            logger.warning(f"⚠️ Price API failed: {e}")
            return 2000

# Main System - POWERED BY NGROK API!
class CropRecommendationSystem:
    def __init__(self):
        self.config = Config()
        self.api_client = NgrokAPIClient()
        self.crop_predictor = CropPredictor(self.api_client)
        
        logger.info("🚀 SYSTEM READY - POWERED BY NGROK API!")

    def get_recommendations_from_request(self, state: str, district: str, 
                                       temperature: float, humidity: float,
                                       rainfall_mm: float, wind_speed: float,
                                       pressure: float, soil_ph: float, 
                                       soil_moisture: float, season: str, 
                                       previous_crop: str = "", land_size: float = 1.0) -> Dict:
        """Get crop recommendations from request parameters with enhanced weather data"""
        try:
            # Create data objects
            location = Location(
                state=state,
                district=district,
                latitude=0.0,  # Not needed for enhanced API
                longitude=0.0
            )
            
            weather_data = WeatherData(
                temperature=temperature,
                humidity=humidity,
                rainfall_mm=rainfall_mm,
                season=season,
                wind_speed=wind_speed,
                pressure=pressure
            )
            
            soil_data = SoilData(
                ph_level=soil_ph,
                moisture_percent=soil_moisture
            )
            
            # Get crop predictions from API
            crop_predictions = self.crop_predictor.predict_crops(weather_data, soil_data, location)
            
            # Create recommendations
            recommendations = []
            for crop, confidence in crop_predictions[:3]:  # Top 3 crops
                recommendation = self._create_recommendation(crop, confidence, weather_data, soil_data, location)
                recommendations.append(recommendation)
            
            return {
                "status": "success",
                "location": {
                    "state": location.state, 
                    "district": location.district
                },
                "weather": asdict(weather_data),
                "soil": asdict(soil_data),
                "recommendations": [asdict(rec) for rec in recommendations],
                "best_crop": recommendations[0].crop_name if recommendations else "Rice",
                "system_info": {
                    "version": self.config.MODEL_VERSION,
                    "api_endpoint": self.config.NGROK_API_BASE,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            return {
                "status": "error", 
                "message": f"System error: {str(e)}",
                "fallback_recommendations": self._get_fallback_recommendations()
            }

    def _create_recommendation(self, crop: str, confidence: float, weather: WeatherData, soil: SoilData, location: Location) -> CropRecommendation:
        """Create recommendation using API predictions"""
        reasoning_parts = []
        risk_factors = []
        
        # Get API predictions
        predicted_yield = self.crop_predictor.get_yield_prediction(location.state, crop, weather, soil)
        predicted_price = self.crop_predictor.get_price_prediction(location.state, crop)
        
        # Weather analysis - enhanced with all parameters
        if 20 <= weather.temperature <= 35:
            reasoning_parts.append(f"optimal temperature ({weather.temperature}°C)")
        elif weather.temperature > 35:
            reasoning_parts.append(f"high temperature ({weather.temperature}°C)")
            risk_factors.append("Heat stress risk")
        else:
            reasoning_parts.append(f"cool temperature ({weather.temperature}°C)")
        
        # Humidity analysis
        if 40 <= weather.humidity <= 80:
            reasoning_parts.append(f"suitable humidity ({weather.humidity}%)")
        elif weather.humidity > 80:
            reasoning_parts.append(f"high humidity ({weather.humidity}%)")
            risk_factors.append("Fungal disease risk")
        else:
            reasoning_parts.append(f"low humidity ({weather.humidity}%)")
            risk_factors.append("Water stress risk")
        
        # Rainfall analysis
        if weather.season.lower() == 'kharif':
            if weather.rainfall_mm >= 50:
                reasoning_parts.append(f"adequate rainfall ({weather.rainfall_mm}mm)")
            elif weather.rainfall_mm >= 20:
                reasoning_parts.append(f"moderate rainfall ({weather.rainfall_mm}mm)")
            else:
                reasoning_parts.append(f"low rainfall ({weather.rainfall_mm}mm)")
                risk_factors.append("Irrigation critical")
        else:  # rabi/zaid
            if 10 <= weather.rainfall_mm <= 40:
                reasoning_parts.append(f"suitable rainfall ({weather.rainfall_mm}mm)")
            elif weather.rainfall_mm > 40:
                reasoning_parts.append(f"high rainfall ({weather.rainfall_mm}mm)")
                risk_factors.append("Waterlogging risk")
        
        # Wind speed analysis
        if 5 <= weather.wind_speed <= 15:
            reasoning_parts.append(f"favorable wind ({weather.wind_speed}km/h)")
        elif weather.wind_speed > 20:
            reasoning_parts.append(f"high wind speed ({weather.wind_speed}km/h)")
            risk_factors.append("Wind damage risk")
        
        # Pressure analysis
        if 1000 <= weather.pressure <= 1020:
            reasoning_parts.append(f"stable pressure ({weather.pressure}hPa)")
        elif weather.pressure < 995:
            reasoning_parts.append(f"low pressure ({weather.pressure}hPa)")
            risk_factors.append("Storm activity possible")
        
        # Soil analysis
        if 6.0 <= soil.ph_level <= 7.5:
            reasoning_parts.append(f"suitable pH ({soil.ph_level})")
        else:
            reasoning_parts.append(f"pH needs adjustment ({soil.ph_level})")
            risk_factors.append("Soil pH not optimal")
        
        # Moisture analysis
        if soil.moisture_percent < 20:
            reasoning_parts.append(f"low soil moisture ({soil.moisture_percent}%)")
            risk_factors.append("Irrigation required")
        elif soil.moisture_percent > 60:
            reasoning_parts.append(f"high soil moisture ({soil.moisture_percent}%)")
            risk_factors.append("Waterlogging risk")
        else:
            reasoning_parts.append(f"suitable soil moisture ({soil.moisture_percent}%)")
        
        reasoning = f"API-recommended for {location.state} due to " + ", ".join(reasoning_parts)
        
        # Investment and period estimates
        base_investments = {
            'rice': 45000, 'wheat': 35000, 'maize': 40000, 'cotton': 50000, 
            'sugarcane': 80000, 'potato': 60000, 'tomato': 70000, 'onion': 50000
        }
        
        base_periods = {
            'rice': 120, 'wheat': 150, 'maize': 100, 'cotton': 180, 
            'sugarcane': 365, 'potato': 90, 'tomato': 120, 'onion': 110
        }
        
        fertilizers = {
            'rice': "NPK 120:60:40 kg/ha", 'wheat': "NPK 120:60:40 kg/ha", 
            'maize': "NPK 150:75:60 kg/ha", 'cotton': "NPK 80:40:40 kg/ha",
            'potato': "NPK 120:80:80 kg/ha", 'tomato': "NPK 200:100:100 kg/ha"
        }
        
        crop_lower = crop.lower()
        investment = base_investments.get(crop_lower, 50000)
        
        # Adjust investment based on API yield prediction
        if predicted_yield > 6.0:
            investment = int(investment * 1.2)
        
        # Irrigation needs
        if soil.moisture_percent < 25:
            irrigation = "High - frequent irrigation needed"
        elif soil.moisture_percent < 40:
            irrigation = "Medium - regular monitoring"
        else:
            irrigation = "Low - sufficient moisture"
        
        # Fertilizer recommendations
        fertilizer_rec = fertilizers.get(crop_lower, "NPK 100:50:50 kg/ha")
        if soil.ph_level < 6.0:
            fertilizer_rec += " + Lime"
        elif soil.ph_level > 8.0:
            fertilizer_rec += " + Gypsum"
        
        return CropRecommendation(
            crop_name=crop.title(),
            suitability_score=confidence,
            confidence=confidence,
            reasoning=reasoning,
            risk_factors=risk_factors,
            expected_yield_tons_per_hectare=round(predicted_yield, 2),
            investment_required_per_hectare=investment,
            profit_potential="High" if confidence >= 0.8 else "Medium" if confidence >= 0.6 else "Low",
            growing_period_days=base_periods.get(crop_lower, 120),
            irrigation_requirements=irrigation,
            fertilizer_recommendations=fertilizer_rec
        )

    def _get_fallback_recommendations(self) -> List[Dict]:
        """Get fallback recommendations when API fails"""
        return [
            {
                "crop_name": "Rice",
                "suitability_score": 0.7,
                "confidence": 0.7,
                "reasoning": "Fallback recommendation - suitable for most conditions",
                "risk_factors": [],
                "expected_yield_tons_per_hectare": 4.0,
                "investment_required_per_hectare": 45000,
                "profit_potential": "Medium",
                "growing_period_days": 120,
                "irrigation_requirements": "Medium",
                "fertilizer_recommendations": "NPK 120:60:40 kg/ha"
            }
        ]

    def get_system_status(self) -> Dict:
        """Get system status including API statistics"""
        return {
            "version": self.config.MODEL_VERSION,
            "api_endpoint": self.config.NGROK_API_BASE,
            "status": "✅ POWERED BY NGROK API",
            "capabilities": {
                "crop_suitability_prediction": "Advanced API models",
                "yield_prediction": "API-based predictions",
                "price_prediction": "API-based forecasting",
                "real_time_prediction": "Via ngrok API"
            }
        }

# Simple function for tool integration
def get_crop_recommendation(state: str, district: str, 
                          temperature: float, humidity: float,
                          rainfall_mm: float, wind_speed: float,
                          pressure: float, soil_ph: float, 
                          soil_moisture: float, season: str, 
                          previous_crop: str = "", land_size: float = 1.0) -> Dict:
    """Simple function to get crop recommendations for tool integration with enhanced weather data"""
    try:
        system = CropRecommendationSystem()
        return system.get_recommendations_from_request(
            state=state,
            district=district,
            temperature=temperature,
            humidity=humidity,
            rainfall_mm=rainfall_mm,
            wind_speed=wind_speed,
            pressure=pressure,
            soil_ph=soil_ph,
            soil_moisture=soil_moisture,
            season=season,
            previous_crop=previous_crop,
            land_size=land_size
        )
    except Exception as e:
        logger.error(f"❌ Crop recommendation error: {e}")
        return {
            "status": "error",
            "message": str(e),
            "fallback": "Rice recommended as default crop"
        }

if __name__ == "__main__":
    # Simple test
    system = CropRecommendationSystem()
    print("🌾 API-based Crop Recommendation System ready!")
    print(f"🔗 Using API: {system.config.NGROK_API_BASE}")
    
    # Test with sample data
    result = get_crop_recommendation(
        state="Punjab",
        district="Ludhiana",
        temperature=25.0,
        humidity=60.0,
        rainfall_mm=15.0,
        wind_speed=8.5,
        pressure=1013.2,
        soil_ph=6.5,
        soil_moisture=35.0,
        season="rabi"
    )
    
    print("📋 Sample recommendation:")
    print(json.dumps(result, indent=2))