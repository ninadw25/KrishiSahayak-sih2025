# 🌾 Crop Classification & Pest Detection API

## 📡 **New Endpoints Added**

### 1. **Crop Classification**
- **URL**: `POST /api/pest/classify-crop`
- **Input**: Image file (JPG, JPEG, PNG, BMP)
- **Output**: Crop classification result with confidence score

### 2. **Pest Detection** (Existing)
- **URL**: `POST /api/pest/detect`
- **Input**: Image file (JPG, JPEG, PNG, BMP)
- **Output**: Pest detection with pesticide recommendations

### 3. **Health Check**
- **URL**: `GET /api/pest/health`
- **Output**: Service status and model availability

## 🚀 **How to Use**

### **1. Start the Server**
```bash
cd krishi_sahayak/backend
uvicorn main:app --reload
```

### **2. Access API Documentation**
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### **3. Test with curl**

**Crop Classification:**
```bash
curl -X POST "http://localhost:8000/api/pest/classify-crop" \
     -H "Content-Type: multipart/form-data" \
     -F "image=@assets/img/wheat.jpeg"
```

**Pest Detection:**
```bash
curl -X POST "http://localhost:8000/api/pest/detect" \
     -H "Content-Type: multipart/form-data" \
     -F "image=@assets/img/test_detector.jpeg"
```

## 📁 **File Structure**
```
backend/
├── routes/
│   └── pest_routes.py          # Both crop & pest endpoints
├── models/
│   ├── crop_classifier.py      # Crop classification logic
│   └── pest_detector.py        # Pest detection logic
├── assets/
│   ├── crop_classifier.pt      # Crop model
│   ├── pest_detector.pt        # Pest model
│   └── img/                    # Uploaded images
└── test_crop_classification.py # Test script
```

## 🎯 **Response Format**

**Crop Classification Success:**
```json
{
  "success": true,
  "message": "Crop classification completed successfully",
  "filename": "crop_upload_1234567890.jpg",
  "classification_result": "Pest identified as: Wheat (Confidence: 85.67%)"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error details here",
  "message": "Crop classification failed"
}
```

## ✅ **Features**
- ✅ **Simple & Clean Code** - Easy to understand
- ✅ **File Upload** - Handles image uploads safely  
- ✅ **Error Handling** - Proper error responses
- ✅ **File Cleanup** - Optional image cleanup after processing
- ✅ **Multiple Formats** - Supports JPG, JPEG, PNG, BMP
- ✅ **Health Checks** - Service monitoring
- ✅ **Auto Documentation** - Swagger UI integration

## 🧪 **Testing**
```bash
# Run the test script
python test_crop_classification.py
```

The endpoints are now ready to use! 🎉