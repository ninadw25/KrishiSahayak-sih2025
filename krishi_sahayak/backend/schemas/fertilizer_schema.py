#!/usr/bin/env python3
"""
Fertilizer Schemas - Pydantic models for fertilizer-related operations
"""

from pydantic import BaseModel

class FertilizerInput(BaseModel):
    """Input model for fertilizer recommendations"""
    crop: str
    N: float
    P: float
    K: float
    ph: float

class SoilProperties(BaseModel):
    """Soil properties model"""
    N: float
    P: float
    K: float
    ph: float

class FertilizerOutput(BaseModel):
    """Output model for fertilizer recommendations"""
    fertilizer: str
    dosage: float
    updated_soil: SoilProperties