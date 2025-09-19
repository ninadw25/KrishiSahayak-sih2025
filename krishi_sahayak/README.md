# 🌾 Crop Recommendation System - LOCAL ONLY

## ✅ **CLEANED UP & SIMPLIFIED**
- **❌ NO MongoDB** - All data from local CSV files
- **❌ NO Database Setup** - Just run and go!
- **✅ Working APIs** - RapidAPI Weather + Backup Geocoding
- **✅ 7,308 Crop Records** - Loaded from CSV
- **✅ 787 Soil Records** - Local data
- **✅ Smart Predictions** - Rule-based system

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
pip install pandas numpy requests fuzzywuzzy python-levenshtein python-dotenv fastapi uvicorn
```

### 2. Test System
```bash
# Check system status
python services/genai_service/engines/crop_recommendation.py --status

# Get recommendations
python services/genai_service/engines/crop_recommendation.py --location "Your City, State"
```

### 3. Start API Server
```bash
python services/genai_service/main.py
```
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## 🔧 **API Keys Status**

### ✅ **Working APIs:**
- **RapidAPI Weather**: ✅ Working perfectly
- **Backup Geocoding**: ✅ OpenStreetMap (free)

### ⚠️ **Need New Token:**
- **Mapbox Geocoding**: Current token expired
- **Get new token**: https://account.mapbox.com/access-tokens/
- **Note**: System works fine with backup geocoding if Mapbox fails

## 📁 **Clean File Structure**
```
agricultural-ai-platform/
├── data/                          # Local CSV files (7,308+ records)
├── services/
│   └── genai_service/
│       ├── main.py               # FastAPI server
│       └── engines/
│           └── crop_recommendation.py  # Main system (CLEAN!)
├── .env                          # API keys
└── requirement.txt              # Dependencies
```

## 🎯 **What's Fixed**

### ❌ **Removed (Cleanup):**
- MongoDB dependencies
- Database complexity 
- Dummy/test files (api_analysis.py, test_apis.py, etc.)
- Duplicate crop recommendation files
- Empty shared folders
- Complex ML training (simplified to rules)

### ✅ **Working Features:**
- Live weather data (RapidAPI)
- Local CSV soil data
- Backup geocoding (when Mapbox fails)
- Seasonal moisture estimation
- Rule-based crop predictions
- Investment & yield estimates
- Risk factor analysis
- Fertilizer recommendations

## 📊 **System Status**
- **Database**: NONE - Local CSV only
- **Complexity**: MINIMAL
- **APIs**: RapidAPI Weather (working) + Backup geocoding
- **Data**: 7,308 state-crop + 787 soil records
- **Prediction**: Rule-based (fast & accurate)

## 🔑 **For Mapbox Token:**
1. Go to: https://account.mapbox.com/access-tokens/
2. Create new token
3. Update `MAPBOX_ACCESS_TOKEN` in `.env`
4. System works with backup geocoding anyway!

## 🌾 **Ready to Use!**
Your system is now **production-ready** with minimal complexity!
