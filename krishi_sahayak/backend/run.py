#!/usr/bin/env python3
"""
Startup script for Agricultural AI Platform Backend
"""

import uvicorn
import sys
import os
from pathlib import Path

# Change to backend directory for proper imports
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

def setup_environment():
    """Setup environment variables"""
    try:
        from dotenv import load_dotenv
        env_file = Path(__file__).parent / ".env"
        if env_file.exists():
            load_dotenv(env_file)
            print("✅ Environment variables loaded from .env")
        else:
            print("⚠️ .env file not found. Run setup_env.py first")
    except ImportError:
        print("⚠️ python-dotenv not installed")

if __name__ == "__main__":
    print("🚀 Starting Agricultural AI Platform Backend...")
    
    # Setup environment
    setup_environment()
    
    print("📍 Database-free architecture with local CSV data")
    print("🌐 Access API at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("❤️  Health check at: http://localhost:8000/health")
    print("🤖 AI Agent chat at: http://localhost:8000/api/agent/chat")
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="debug"
        )
    except Exception as e:
        print(f"❌ Failed to start server: {str(e)}")
        print("💡 Try running: python test_imports.py first")
        sys.exit(1)