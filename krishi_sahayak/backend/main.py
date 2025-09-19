from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
import os
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add current directory to Python path for imports
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Import route modules
from routes.fertilizer_routes import fertilizer_router
from routes.agent_routes import agent_router

# Global variables for system initialization
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events"""
    # Startup
    logger.info("🌾 Initializing Agricultural AI Platform...")
    logger.info("📊 Loading ML models and data...")
    
    try:
        # Initialize any global state here
        app_state["status"] = "initialized"
        logger.info("✅ Platform initialization complete")
    except Exception as e:
        logger.error(f"❌ Platform initialization failed: {str(e)}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down Agricultural AI Platform...")
    app_state["status"] = "shutdown"

# Create FastAPI application
app = FastAPI(
    title="Agricultural AI Platform",
    description="Centralized backend for crop recommendations, fertilizer suggestions, and agricultural insights",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(fertilizer_router, prefix="/api", tags=["Fertilizer"])
app.include_router(agent_router, prefix="/api/agent", tags=["AI Agent"])

@app.get("/")
async def root():
    """Root endpoint with platform information"""
    return {
        "platform": "Agricultural AI Platform",
        "version": "2.0.0",
        "description": "Centralized backend for agricultural AI services",
        "status": "running",
        "architecture": "database-free, CSV-based",
        "available_services": [
            "ai_agent_chat",
            "fertilizer_recommendations",
            "crop_recommendations",
            "soil_analysis",
            "weather_integration"
        ],
        "endpoints": {
            "ai_agent": "/api/agent/chat",
            "fertilizer": "/api/fertilizer_recommender",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "platform": "Agricultural AI Platform",
        "version": "2.0.0",
        "system_status": app_state.get("status", "unknown"),
        "services": {
            "fertilizer_service": "active",
            "data_processing": "active",
            "ml_models": "loaded",
            "llm_service": "configured"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Agricultural AI Platform Backend...")
    logger.info("📍 Database-free architecture with local CSV data")
    logger.info("🌐 Access API at: http://localhost:8000")
    logger.info("📚 API documentation at: http://localhost:8000/docs")
    logger.info("❤️  Health check at: http://localhost:8000/health")
    logger.info("🤖 AI Agent chat at: http://localhost:8000/api/agent/chat")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )