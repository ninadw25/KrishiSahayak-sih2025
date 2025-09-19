"""
Crop Recommendation Routes for KrishiSahayak
Provides crop recommendation endpoints based on location and soil conditions
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import sys
from pathlib import Path
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Add paths for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from schemas.crop_schema import CropRequest, CropResponse, CropError, CropRecommendation, WeatherData
from services.weather_service import get_weather

router = APIRouter(prefix="/crop", tags=["Crop Recommendation"])

# Simplified crop prediction logic (extracted from crop_model.py)
class SimpleCropPredictor:
    """Simplified crop prediction based on weather and soil conditions"""
    
    def __init__(self):
        # Crop rules with optimal conditions
        self.crop_rules = {
            'rice': {
                'temp_range': (20, 35),
                'humidity_min': 60,
                'ph_range': (5.5, 7.0),
                'moisture_range': (30, 70),
                'season': ['kharif'],
                'base_score': 0.80
            },
            'wheat': {
                'temp_range': (15, 25),
                'humidity_min': 40,
                'ph_range': (6.0, 7.5),
                'moisture_range': (15, 40),
                'season': ['rabi'],
                'base_score': 0.70
            },
            'maize': {
                'temp_range': (18, 32),
                'humidity_min': 50,
                'ph_range': (6.0, 7.0),
                'moisture_range': (20, 50),
                'season': ['kharif', 'rabi'],
                'base_score': 0.60
            },
            'cotton': {
                'temp_range': (20, 35),
                'humidity_min': 40,
                'ph_range': (5.8, 8.0),
                'moisture_range': (10, 30),
                'season': ['kharif'],
                'base_score': 0.50
            },
            'sugarcane': {
                'temp_range': (20, 35),
                'humidity_min': 70,
                'ph_range': (6.0, 7.5),
                'moisture_range': (40, 80),
                'season': ['kharif'],
                'base_score': 0.60
            }
        }
        
        # Base yields and investments
        self.base_yields = {
            'rice': 4.5,
            'wheat': 3.2,
            'maize': 5.8,
            'cotton': 1.8,
            'sugarcane': 75.0
        }
        
        self.base_investments = {
            'rice': 45000,
            'wheat': 35000,
            'maize': 40000,
            'cotton': 50000,
            'sugarcane': 80000
        }
    
    def predict_crops(self, temp: float, humidity: float, soil_ph: float, 
                     soil_moisture: float, season: str) -> list:
        """Predict best crops based on conditions"""
        recommendations = []
        
        for crop, rule in self.crop_rules.items():
            score = rule['base_score']
            
            # Temperature check
            tmin, tmax = rule['temp_range']
            if tmin <= temp <= tmax:
                score += 0.10
            elif abs(temp - tmin) <= 5 or abs(temp - tmax) <= 5:
                score += 0.05
            else:
                score -= 0.10
            
            # Humidity check
            if humidity >= rule['humidity_min']:
                score += 0.05
            
            # pH check
            phmin, phmax = rule['ph_range']
            if phmin <= soil_ph <= phmax:
                score += 0.10
            else:
                score -= 0.05
            
            # Moisture check
            mmin, mmax = rule['moisture_range']
            if mmin <= soil_moisture <= mmax:
                score += 0.10
            else:
                score -= 0.05
            
            # Season check
            if season.lower() in [s.lower() for s in rule['season']]:
                score += 0.10
            
            # Clamp score between 0 and 1
            score = max(0.0, min(1.0, score))
            
            # Calculate yield and profit
            yield_t = self.base_yields.get(crop, 3.0)
            if 25 <= soil_moisture <= 45:
                yield_t *= 1.10
            if 6.0 <= soil_ph <= 7.5:
                yield_t *= 1.05
            yield_t = round(yield_t, 2)
            
            # Calculate risks
            risks = []
            if soil_moisture < mmin:
                risks.append("Drought risk - irrigation needed")
            if soil_moisture > mmax:
                risks.append("Waterlogging risk")
            if not (phmin <= soil_ph <= phmax):
                risks.append("Soil pH sub-optimal")
            if temp < tmin or temp > tmax:
                risks.append("Temperature stress possible")
            
            # Create recommendation
            recommendation = CropRecommendation(
                crop=crop.title(),
                suitability_score=round(score, 3),
                confidence=round(score * 100, 1),
                predicted_yield_t_per_ha=yield_t,
                profit_estimate=int(self.base_investments.get(crop, 40000) * 1.5),
                fertilizer=f"NPK recommended for {crop}",
                risks=risks,
                reasoning=f"Score based on temp({temp}°C), humidity({humidity}%), pH({soil_ph}), moisture({soil_moisture}%)"
            )
            
            recommendations.append(recommendation)
        
        # Sort by suitability score
        recommendations.sort(key=lambda x: x.suitability_score, reverse=True)
        return recommendations

# Global predictor instance
predictor = SimpleCropPredictor()

@router.post("/recommend", response_model=CropResponse)
async def recommend_crop(request: CropRequest):
    """
    Recommend crops based on location, weather, and soil conditions
    
    This endpoint:
    1. Gets weather data (temperature, humidity) using coordinates
    2. Analyzes soil conditions and season
    3. Returns ranked crop recommendations with yield predictions
    """
    try:
        logger.info(f"Crop recommendation request for {request.district}, {request.state}")
        
        # Validate inputs
        if request.season.lower() not in ['kharif', 'rabi', 'zaid']:
            raise HTTPException(
                status_code=400,
                detail="Season must be one of: kharif, rabi, zaid"
            )
        
        # Get weather data from coordinates
        weather_data = get_weather(request.latitude, request.longitude)
        
        if not weather_data:
            raise HTTPException(
                status_code=503,
                detail="Could not fetch weather data for given coordinates"
            )
        
        # Extract temperature and humidity
        temperature = weather_data.get('temperature', 25.0)
        humidity = weather_data.get('humidity', 60.0)
        weather_condition = weather_data.get('weather_condition', 'Unknown')
        
        logger.info(f"Weather: {temperature}°C, {humidity}% humidity")
        
        # Get crop recommendations
        recommendations = predictor.predict_crops(
            temp=temperature,
            humidity=humidity,
            soil_ph=request.soil_ph,
            soil_moisture=request.soil_moisture,
            season=request.season
        )
        
        if not recommendations:
            raise HTTPException(
                status_code=400,
                detail="Could not generate crop recommendations"
            )
        
        # Create weather data object
        weather_obj = WeatherData(
            temperature=temperature,
            humidity=humidity,
            weather_condition=weather_condition
        )
        
        # Create response
        response = CropResponse(
            success=True,
            message="Crop recommendations generated successfully",
            location={
                "state": request.state,
                "district": request.district,
                "latitude": request.latitude,
                "longitude": request.longitude,
                "land_size": request.land_size
            },
            weather_data=weather_obj,
            recommendations=recommendations,
            best_crop=recommendations[0].crop
        )
        
        logger.info(f"Recommended {len(recommendations)} crops, best: {recommendations[0].crop}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in crop recommendation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/health")
async def crop_health_check():
    """Health check for crop recommendation service"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "crop_recommendation",
            "available_crops": list(predictor.crop_rules.keys()),
            "supported_seasons": ["kharif", "rabi", "zaid"],
            "endpoints": {
                "recommend": "/api/crop/recommend",
                "health": "/api/crop/health"
            }
        }
    )

@router.get("/test")
async def test_crop_endpoint():
    """Test endpoint with sample data"""
    try:
        # Test data for Punjab, India
        test_request = CropRequest(
            latitude=30.7333,
            longitude=76.7794,
            state="Punjab",
            district="Chandigarh",
            previous_crop="rice",
            land_size=5.0,
            season="rabi",
            soil_ph=6.8,
            soil_moisture=35.0
        )
        
        result = await recommend_crop(test_request)
        return {
            "message": "Test successful - crop recommendation for Punjab",
            "test_data": {
                "location": "Punjab, Chandigarh",
                "season": "rabi",
                "coordinates": [30.7333, 76.7794]
            },
            "result": result
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Test failed",
                "error": str(e)
            }
        )