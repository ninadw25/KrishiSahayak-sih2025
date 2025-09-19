# Agricultural AI Platform - Startup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd agricultural-ai-platform/backend
pip install -r requirements.txt
```

### 2. Setup Environment
```bash
python setup_env.py
```

### 3. Test Installation
```bash
python test_imports.py
```

### 4. Start Server
```bash
python run.py
```

## Troubleshooting

### Common Issues

#### 1. Import Errors
**Problem**: `ModuleNotFoundError` or import issues
**Solution**: 
```bash
# Test imports first
python test_imports.py

# Make sure you're in the backend directory
cd agricultural-ai-platform/backend
```

#### 2. Missing API Keys
**Problem**: LLM service fails to initialize
**Solution**:
```bash
# Setup environment
python setup_env.py

# Edit .env file and add your API keys:
# GOOGLE_API_KEY=your_actual_key
# GROQ_API_KEY=your_actual_key
```

#### 3. Data File Not Found
**Problem**: `fertilizer_crop.csv not found`
**Solution**: Make sure you're running from the backend directory and the data folder exists in the parent directory.

#### 4. Port Already in Use
**Problem**: `Address already in use`
**Solution**: 
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn app.main:app --port 8001
```

### Manual Startup (Alternative)
```bash
cd agricultural-ai-platform/backend
export PYTHONPATH=$PWD/app:$PYTHONPATH
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

Once running, access:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **AI Agent Chat**: http://localhost:8000/api/agent/chat
- **Fertilizer API**: http://localhost:8000/api/fertilizer_recommender

## Testing the API

### Test AI Agent
```bash
curl -X POST "http://localhost:8000/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What crop should I plant?"}'
```

### Test Fertilizer API
```bash
curl -X POST "http://localhost:8000/api/fertilizer_recommender" \
  -H "Content-Type: application/json" \
  -d '{
    "crop": "rice",
    "N": 50,
    "P": 30,
    "K": 40,
    "ph": 6.5
  }'
```

## Docker Deployment

### Build and Run
```bash
cd agricultural-ai-platform/backend
docker build -t agricultural-ai-backend .
docker run -p 8000:8000 --env-file .env agricultural-ai-backend
```

### Using Docker Compose
```bash
docker-compose -f docker-compose.azure.yml up
```