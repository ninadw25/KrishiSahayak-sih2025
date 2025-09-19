#!/usr/bin/env python3
"""
Crop Recommendation Schema for KrishiSahayak
Pydantic models for crop recommendation input/output
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .fertilizer_schema import SoilProperties

# Keep old models for backward compatibility
class CropRecommenderInput(BaseModel):
    """Input model for crop recommendations (legacy)"""
    state: str
    district: str
    prev_crop: str
    land_size: float
    season: str
    month_before_harvest: int
    soil_properties: SoilProperties

class CropRecommenderOutput(BaseModel):
    """Output model for crop recommendations (legacy)"""
    crop_name: str
    confidence: int

# New comprehensive models for coordinate-based crop recommendation
class CropRequest(BaseModel):
    """Request model for crop recommendation with coordinates"""
    latitude: float = Field(..., description="Latitude coordinate", ge=-90, le=90)
    longitude: float = Field(..., description="Longitude coordinate", ge=-180, le=180)
    state: str = Field(..., description="State name")
    district: str = Field(..., description="District name")
    previous_crop: str = Field(..., description="Previously grown crop")
    land_size: float = Field(..., description="Land size in acres", gt=0)
    season: str = Field(..., description="Growing season (kharif/rabi/zaid)")
    soil_ph: float = Field(..., description="Soil pH level", ge=0, le=14)
    soil_moisture: float = Field(..., description="Soil moisture percentage", ge=0, le=100)

class CropRecommendation(BaseModel):
    """Individual crop recommendation"""
    crop: str = Field(..., description="Recommended crop name")
    suitability_score: float = Field(..., description="Suitability score (0-1)")
    confidence: float = Field(..., description="Confidence percentage")
    predicted_yield_t_per_ha: float = Field(..., description="Predicted yield in tons per hectare")
    profit_estimate: Optional[int] = Field(None, description="Estimated profit in INR")
    fertilizer: str = Field(..., description="Fertilizer recommendation")
    risks: List[str] = Field(default=[], description="Identified risks")
    reasoning: str = Field(..., description="Reasoning for recommendation")

class WeatherData(BaseModel):
    """Weather data used in prediction"""
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Humidity percentage")
    weather_condition: Optional[str] = Field(None, description="Weather condition")

class CropResponse(BaseModel):
    """Complete crop recommendation response"""
    success: bool = Field(..., description="Request success status")
    message: str = Field(..., description="Response message")
    location: dict = Field(..., description="Location information")
    weather_data: WeatherData = Field(..., description="Weather data used")
    recommendations: List[CropRecommendation] = Field(..., description="List of crop recommendations")
    best_crop: str = Field(..., description="Top recommended crop")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

class CropError(BaseModel):
    """Error response for crop recommendation"""
    success: bool = Field(default=False, description="Request success status")
    error: str = Field(..., description="Error message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")