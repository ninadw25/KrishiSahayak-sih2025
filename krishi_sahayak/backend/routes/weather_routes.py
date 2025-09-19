"""
Weather API Routes for KrishiSahayak
Provides weather data endpoints for agricultural applications
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

from schemas.weather_schema import WeatherRequest, WeatherResponse, WeatherError, WeatherData, LocationData
from services.weather_service import get_weather

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.post("/get-weather", response_model=WeatherResponse)
async def get_weather_by_coordinates(request: WeatherRequest):
    """
    Get weather data by latitude and longitude coordinates
    
    This endpoint fetches current weather data for farming applications:
    - Temperature and humidity for crop planning
    - Wind conditions for pesticide application
    - Rainfall data for irrigation planning
    - Weather conditions for harvesting decisions
    """
    try:
        logger.info(f"Weather request for coordinates: {request.latitude}, {request.longitude}")
        
        # Validate coordinates
        if not (-90 <= request.latitude <= 90):
            raise HTTPException(
                status_code=400, 
                detail="Latitude must be between -90 and 90 degrees"
            )
        
        if not (-180 <= request.longitude <= 180):
            raise HTTPException(
                status_code=400, 
                detail="Longitude must be between -180 and 180 degrees"
            )
        
        # Get weather data from service
        weather_data = get_weather(
            latitude=request.latitude,
            longitude=request.longitude,
            language=request.language
        )
        
        if not weather_data:
            raise HTTPException(
                status_code=503,
                detail="Weather service unavailable or returned no data"
            )
        
        # Create location data
        location = LocationData(
            latitude=request.latitude,
            longitude=request.longitude,
            city=weather_data.get('city'),
            country=weather_data.get('country'),
            timezone=weather_data.get('timezone')
        )
        
        # Create weather data object
        weather = WeatherData(
            temperature=weather_data.get('temperature', 0),
            feels_like=weather_data.get('feels_like'),
            humidity=weather_data.get('humidity', 0),
            pressure=weather_data.get('pressure'),
            visibility=weather_data.get('visibility'),
            wind_speed=weather_data.get('wind_speed'),
            wind_direction=weather_data.get('wind_direction'),
            weather_condition=weather_data.get('weather_condition', 'Unknown'),
            weather_icon=weather_data.get('weather_icon'),
            cloud_coverage=weather_data.get('cloud_coverage'),
            uv_index=weather_data.get('uv_index')
        )
        
        # Create response
        response = WeatherResponse(
            success=True,
            message="Weather data retrieved successfully",
            location=location,
            weather=weather,
            raw_data=weather_data  # Include raw data for debugging
        )
        
        logger.info("Weather data retrieved and formatted successfully")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in weather endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/health")
async def weather_health_check():
    """Health check for weather service"""
    try:
        # Test with a known good coordinate (New York)
        test_weather = get_weather(40.7128, -74.0060)
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "service": "weather_api",
                "api_accessible": test_weather is not None,
                "endpoints": {
                    "get_weather": "/api/weather/get-weather",
                    "health": "/api/weather/health"
                }
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "weather_api",
                "error": str(e)
            }
        )

@router.get("/test")
async def test_weather_endpoint():
    """
    Test endpoint with sample coordinates
    Returns weather for New York City for testing
    """
    try:
        # Test coordinates (New York City)
        test_request = WeatherRequest(
            latitude=40.7128,
            longitude=-74.0060,
            language="EN"
        )
        
        result = await get_weather_by_coordinates(test_request)
        return {
            "message": "Test successful - this is weather data for New York City",
            "test_coordinates": {
                "latitude": 40.7128,
                "longitude": -74.0060,
                "location": "New York City"
            },
            "weather_result": result
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "message": "Test failed",
                "error": str(e)
            }
        )