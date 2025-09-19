# Technology Stack & Build System

## Core Technologies
- **Python 3.x**: Primary programming language
- **FastAPI**: Web framework for all API services
- **Uvicorn**: ASGI server for FastAPI applications
- **Pandas**: Data manipulation and CSV processing
- **NumPy**: Numerical computations
- **Scikit-learn**: Machine learning models
- **Pydantic**: Data validation and serialization
- **LangChain**: LLM framework and tools
- **LangGraph**: Agent workflow orchestration
- **Gemini/Groq**: LLM providers (configurable)

## Data Processing
- **CSV-based**: All data stored in local CSV files
- **FuzzyWuzzy**: String matching for location/crop names
- **Requests**: HTTP client for external APIs
- **Python-dotenv**: Environment variable management

## External APIs
- **RapidAPI Weather**: Live weather data (working)
- **Mapbox Geocoding**: Location services (backup: OpenStreetMap)

## Development Dependencies
```
pandas>=1.5.0
numpy>=1.21.0
scikit-learn>=1.3.0
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
pydantic>=2.0.0
requests>=2.28.0
python-dotenv>=1.0.0
fuzzywuzzy>=0.18.0
python-Levenshtein>=0.12.0
langchain>=0.1.0
langgraph>=0.1.0
langchain-google-genai>=1.0.0
langchain-groq>=0.1.0
```

## Common Commands

### Installation
```bash
pip install -r backend/requirements.txt

# Set environment variables in .env file:
# GOOGLE_API_KEY=your_gemini_key
# GROQ_API_KEY=your_groq_key
```

### Testing System
```bash
# Check system status
python services/genai_service/engines/crop_recommendation.py --status

# Test recommendations
python services/genai_service/engines/crop_recommendation.py --location "Your City, State"
```

### Running Services
```bash
# Setup and test (first time)
cd agricultural-ai-platform/backend
python setup_env.py
python test_imports.py

# Start the server (multiple options)
python start.py
# OR
python run.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### API Access
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Root Endpoint**: http://localhost:8000/

## Code Style Guidelines
- Use type hints with Pydantic models
- Follow FastAPI patterns for route definitions
- Handle errors with HTTPException
- Use async/await for API endpoints
- Keep CSV data processing synchronous
- Environment variables for API keys
- Modular route organization in `routes/` directory
- ML models in separate `models/` directory
- Use dependency injection for model initialization