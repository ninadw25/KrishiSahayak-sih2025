"""
Weather API Schema for KrishiSahayak
Pydantic models for weather data input/output
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WeatherRequest(BaseModel):
    """Request model for weather API"""
    latitude: float = Field(..., description="Latitude coordinate", ge=-90, le=90)
    longitude: float = Field(..., description="Longitude coordinate", ge=-180, le=180)
    language: Optional[str] = Field(default="EN", description="Language for weather data")

class WeatherData(BaseModel):
    """Complete weather data response model"""
    temperature: float = Field(..., description="Temperature in Celsius")
    feels_like: Optional[float] = Field(None, description="Feels like temperature in Celsius")
    humidity: int = Field(..., description="Humidity percentage")
    pressure: Optional[int] = Field(None, description="Atmospheric pressure in hPa")
    visibility: Optional[float] = Field(None, description="Visibility in km")
    wind_speed: Optional[float] = Field(None, description="Wind speed in km/h")
    wind_direction: Optional[int] = Field(None, description="Wind direction in degrees")
    weather_condition: str = Field(..., description="Weather condition description")
    weather_icon: Optional[str] = Field(None, description="Weather icon code")
    cloud_coverage: Optional[int] = Field(None, description="Cloud coverage percentage")
    uv_index: Optional[float] = Field(None, description="UV index")

class LocationData(BaseModel):
    """Location information"""
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate") 
    city: Optional[str] = Field(None, description="City name")
    country: Optional[str] = Field(None, description="Country name")
    timezone: Optional[str] = Field(None, description="Timezone offset")

class WeatherResponse(BaseModel):
    """Complete weather API response"""
    success: bool = Field(..., description="API call success status")
    message: str = Field(..., description="Response message")
    location: LocationData = Field(..., description="Location data")
    weather: WeatherData = Field(..., description="Weather data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    raw_data: Optional[dict] = Field(None, description="Raw API response for debugging")

class WeatherError(BaseModel):
    """Error response model"""
    success: bool = Field(default=False, description="API call success status")
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code if available")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")