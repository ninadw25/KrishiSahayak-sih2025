# Project Structure & Organization

## Root Directory Layout
```
agricultural-ai-platform/
├── .env                    # API keys and configuration
├── docker-compose.yml      # Container orchestration
├── requirement.txt         # Python dependencies
├── README.md              # Project documentation
├── data/                  # Local CSV data files
├── services/              # Microservices
├── backend/               # Backend API services
├── models/                # Pre-trained ML models
├── data_processing/       # Data cleaning scripts
├── gateway/               # API gateway
└── nginx/                 # Web server configuration
```

## Data Directory (`data/`)
- **CSV Files**: All data stored as local CSV files (no database)
- **Key Files**: 
  - `state_crop_mapping.csv` (7,308+ records)
  - `district_soil_mapping.csv` (787+ records)
  - `crop_production.csv`, `fertilizer_recommendations.csv`
- **Subdirectories**: `ML/`, `weather/`, `soil_moisture/`, `price_data/`

## Services Architecture (`services/`)
```
services/
├── genai_service/         # Main crop recommendation API
│   ├── main.py           # FastAPI server (port 8000)
│   └── engines/          # Core recommendation logic
├── llm_service/          # Language model processing
├── ml_service/           # Machine learning models
└── rotation_score/       # Crop rotation scoring
```

## Backend Services (`backend/`)
- **main.py**: Centralized FastAPI backend hub
- **models/**: ML model implementations and classes
- **routes/**: Feature-specific route definitions
- **schemas/**: Pydantic models organized by feature
- **ai_workflow/**: LangGraph workflow implementations
- **services/**: Business logic layer

## Models Directory (`models/`)
- **Pre-trained Models**: `.joblib` files for ML models
- **Feature Processing**: Scalers and encoders
- **Model Types**: Suitability, yield prediction models

## Data Processing (`data_processing/`)
- **Cleaning Scripts**: CSV data preparation
- **Analysis Tools**: Data validation and processing
- **Scrapers**: Price data collection utilities

## Configuration Files
- **`.env`**: API keys (RapidAPI, Mapbox tokens)
- **`requirement.txt`**: Python package dependencies
- **`docker-compose.yml`**: Service orchestration

## Naming Conventions
- **Files**: Snake_case for Python files and CSV data
- **Services**: Descriptive names ending with `_service`
- **APIs**: RESTful endpoints with clear resource names
- **Models**: Descriptive names with `.joblib` extension

## Key Principles
- **Flat Data Structure**: CSV files in organized subdirectories
- **Centralized Backend**: Single FastAPI hub in `backend/main.py`
- **Modular Routes**: Feature-specific routes in `routes/` directory
- **Schema Organization**: Pydantic models in `schemas/` by feature
- **Model Separation**: ML models in `models/` directory
- **Configuration Centralization**: Environment variables in `.env`
- **Model Persistence**: Pre-trained models stored as `.joblib` files