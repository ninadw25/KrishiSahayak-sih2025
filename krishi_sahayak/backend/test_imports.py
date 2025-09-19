#!/usr/bin/env python3
"""
Test script to check if all imports work correctly
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_imports():
    """Test all critical imports"""
    print("🧪 Testing imports...")
    
    try:
        print("📦 Testing FastAPI imports...")
        from fastapi import FastAPI
        print("✅ FastAPI import successful")
        
        print("📦 Testing schema imports...")
        from schemas.agent_schema import ChatInput, ChatOutput
        from schemas.fertilizer_schema import FertilizerInput, FertilizerOutput
        print("✅ Schema imports successful")
        
        print("📦 Testing route imports...")
        from routes.fertilizer_routes import fertilizer_router
        from routes.agent_routes import agent_router
        print("✅ Route imports successful")
        
        print("📦 Testing LLM service imports...")
        from services.llm_service import get_llm_service
        print("✅ LLM service import successful")
        
        print("📦 Testing model imports...")
        from models.fertilizer_model import FertilizerRecommendationSystem
        print("✅ Model imports successful")
        
        print("📦 Testing tool imports...")
        from ai_workflow.tools.agricultural_tools import CropRecommendationTool
        print("✅ Tool imports successful")
        
        print("📦 Testing agent imports...")
        from ai_workflow.agent import AgriculturalAgent
        print("✅ Agent imports successful")
        
        print("📦 Testing graph imports...")
        from ai_workflow.graph import AgriculturalAgentGraph
        print("✅ Graph imports successful")
        
        print("\n🎉 All imports successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return False

def test_data_paths():
    """Test if data files exist"""
    print("\n📁 Testing data file paths...")
    
    try:
        backend_dir = Path(__file__).parent.parent  # Go to agricultural-ai-platform
        data_dir = backend_dir / "data" / "ML"
        csv_path = data_dir / "fertilizer_crop.csv"
        
        print(f"📍 Looking for data at: {csv_path}")
        
        if csv_path.exists():
            print("✅ Fertilizer data file found")
            return True
        else:
            print("❌ Fertilizer data file not found")
            return False
            
    except Exception as e:
        print(f"❌ Data path test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Running Agricultural AI Platform Import Tests...")
    
    imports_ok = test_imports()
    data_ok = test_data_paths()
    
    if imports_ok and data_ok:
        print("\n✅ All tests passed! Ready to start the server.")
        print("🚀 Run: python run.py")
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)