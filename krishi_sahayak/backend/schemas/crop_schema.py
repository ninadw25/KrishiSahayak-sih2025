#!/usr/bin/env python3
"""
Crop Schemas - Pydantic models for crop-related operations
"""

from pydantic import BaseModel
from .fertilizer_schema import SoilProperties

class CropRecommenderInput(BaseModel):
    """Input model for crop recommendations"""
    state: str
    district: str
    prev_crop: str
    land_size: float
    season: str
    month_before_harvest: int
    soil_properties: SoilProperties

class CropRecommenderOutput(BaseModel):
    """Output model for crop recommendations"""
    crop_name: str
    confidence: int