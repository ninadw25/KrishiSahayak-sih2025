#!/usr/bin/env python3
"""
Simple startup script for Agricultural AI Platform Backend
"""

import os
import sys
from pathlib import Path

def main():
    """Start the server"""
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Setup environment
    try:
        from dotenv import load_dotenv
        env_file = backend_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)
            print("✅ Environment variables loaded")
    except ImportError:
        print("⚠️ python-dotenv not installed")
    
    print("🚀 Starting Agricultural AI Platform Backend...")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    
    # Start with uvicorn command
    os.system("uvicorn main:app --host 0.0.0.0 --port 8000 --reload")

if __name__ == "__main__":
    main()