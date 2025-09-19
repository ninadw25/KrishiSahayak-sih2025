from fastapi import APIRouter, HTTPException
import sys
from pathlib import Path
import pandas as pd

# Add models directory to Python path
current_dir = Path(__file__).parent.parent
models_dir = current_dir / "models"
sys.path.insert(0, str(models_dir))

# Import schemas
from schemas.fertilizer_schema import FertilizerInput, FertilizerOutput, SoilProperties

# Import the fertilizer model
from models.fertilizer_model import FertilizerRecommendationSystem

# Create router
fertilizer_router = APIRouter()

# Global fertilizer system instance
fertilizer_system = None

@fertilizer_router.post("/fertilizer_recommender", response_model=FertilizerOutput)
async def fertilizer_recommender(input_data: FertilizerInput):
    """Get fertilizer recommendation"""
    global fertilizer_system
    
    # Initialize system if needed
    if fertilizer_system is None:
        try:
            data_dir = current_dir.parent / "data" / "ML"
            csv_path = data_dir / "fertilizer_crop.csv"
            
            fertilizer_system = FertilizerRecommendationSystem(str(csv_path))
            crop_data = pd.read_csv(csv_path)
            fertilizer_system.train_model(crop_data)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"System initialization failed: {str(e)}")
    
    try:
        # Get recommendation
        fertilizer, dosage = fertilizer_system.recommend_fertilizer(
            N=input_data.N,
            P=input_data.P,
            K=input_data.K,
            ph=input_data.ph,
            crop=input_data.crop
        )
        
        # Get updated soil parameters
        current_soil = {
            'N': input_data.N,
            'P': input_data.P,
            'K': input_data.K,
            'ph': input_data.ph
        }
        
        updated_soil = fertilizer_system.update_soil_parameters(
            current_soil=current_soil,
            fertilizer=fertilizer,
            dosage=dosage
        )
        
        return FertilizerOutput(
            fertilizer=fertilizer,
            dosage=round(float(dosage), 2),
            updated_soil=SoilProperties(
                N=round(float(updated_soil['N']), 2),
                P=round(float(updated_soil['P']), 2),
                K=round(float(updated_soil['K']), 2),
                ph=round(float(updated_soil['ph']), 2)
            )
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Recommendation failed: {str(e)}")