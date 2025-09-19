#!/usr/bin/env python3
"""
Test script to check if Pydantic issues are fixed
"""

import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_tool_imports():
    """Test if tool imports work without Pydantic errors"""
    print("🧪 Testing tool imports...")
    
    try:
        print("📦 Testing individual tool imports...")
        
        from ai_workflow.tools.agricultural_tools import CropRecommendationTool
        print("✅ CropRecommendationTool imported successfully")
        
        from ai_workflow.tools.agricultural_tools import FertilizerRecommendationTool
        print("✅ FertilizerRecommendationTool imported successfully")
        
        from ai_workflow.tools.agricultural_tools import SoilHealthTool
        print("✅ SoilHealthTool imported successfully")
        
        from ai_workflow.tools.agricultural_tools import WeatherTool
        print("✅ WeatherTool imported successfully")
        
        from ai_workflow.tools.agricultural_tools import PriceTool
        print("✅ PriceTool imported successfully")
        
        from ai_workflow.tools.agricultural_tools import RAGTool
        print("✅ RAGTool imported successfully")
        
        print("\n📦 Testing tool instantiation...")
        
        crop_tool = CropRecommendationTool()
        print("✅ CropRecommendationTool instantiated successfully")
        
        soil_tool = SoilHealthTool()
        print("✅ SoilHealthTool instantiated successfully")
        
        weather_tool = WeatherTool()
        print("✅ WeatherTool instantiated successfully")
        
        price_tool = PriceTool()
        print("✅ PriceTool instantiated successfully")
        
        rag_tool = RAGTool()
        print("✅ RAGTool instantiated successfully")
        
        print("\n🎉 All tool imports and instantiations successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Tool import/instantiation failed: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return False

def test_main_imports():
    """Test if main application imports work"""
    print("\n🧪 Testing main application imports...")
    
    try:
        from main import app
        print("✅ Main app imported successfully")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Main app import failed: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🚀 Running Pydantic Fix Test...")
    
    tools_ok = test_tool_imports()
    main_ok = test_main_imports()
    
    if tools_ok and main_ok:
        print("\n✅ All Pydantic issues fixed! Server should start now.")
        print("🚀 Try: uvicorn main:app --host 0.0.0.0 --port 8000")
    else:
        print("\n❌ Some issues remain. Check the errors above.")
        sys.exit(1)