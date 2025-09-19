#!/usr/bin/env python3
"""
Environment setup script for Agricultural AI Platform
"""

import os
from pathlib import Path

def setup_environment():
    """Setup environment variables and check configuration"""
    print("🔧 Setting up Agricultural AI Platform environment...")
    
    # Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    
    if not env_file.exists():
        print("⚠️ .env file not found. Creating from example...")
        
        # Create basic .env file
        env_content = """# LLM API Keys - Add your keys here
GOOGLE_API_KEY=your_google_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Other API Keys
RAPIDAPI_WEATHER_KEY=73f2fd1e31msh46c4f3b73496818p1b855fjsnd990976ad0ef
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFuYXYyMTM5IiwiYSI6ImNtMHNwNDV3bTBneTQyaXM1NzdubHJ6NXMifQ.fOEo3EWQXRxgGFV2ewz0eg

# Processing Parameters
MIN_FUZZY_SCORE=80
MODEL_VERSION=v2.0
"""
        
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created .env file at: {env_file}")
        print("🔑 Please add your API keys to the .env file")
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print("✅ Environment variables loaded")
    except ImportError:
        print("⚠️ python-dotenv not installed. Install with: pip install python-dotenv")
    
    # Check critical environment variables
    print("\n🔍 Checking environment variables...")
    
    google_key = os.getenv("GOOGLE_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    
    if google_key and google_key != "your_google_gemini_api_key_here":
        print("✅ Google API key configured")
    else:
        print("⚠️ Google API key not configured")
    
    if groq_key and groq_key != "your_groq_api_key_here":
        print("✅ Groq API key configured")
    else:
        print("⚠️ Groq API key not configured")
    
    if not google_key and not groq_key:
        print("❌ No LLM API keys configured! Please add at least one API key to .env")
        return False
    
    print("\n✅ Environment setup complete!")
    return True

if __name__ == "__main__":
    setup_environment()