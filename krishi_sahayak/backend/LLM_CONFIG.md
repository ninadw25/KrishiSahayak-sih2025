# LLM Configuration Guide

## Available LLM Providers

The Agricultural AI Platform supports two LLM providers:

1. **Google Gemini** (Default)
2. **Groq** (Alternative)

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
# Google Gemini API Key (get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Groq API Key (get from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Provider Selection

#### Option A: Use Both (Dynamic Selection)
- Set both API keys in `.env`
- The system will use Gemini by default
- You can switch providers programmatically

#### Option B: Force Single Provider
Edit `services/llm_service.py` and uncomment one of the options:

**Force Gemini Only:**
```python
def _initialize_groq(self):
    """Initialize Groq LLM - DISABLED, using Gemini instead"""
    logger.debug("⚠️ Groq LLM is disabled - using Gemini instead")
    self._initialize_gemini()
```

**Force Groq Only:**
```python
def _initialize_gemini(self):
    """Initialize Google Gemini LLM - DISABLED, using Groq instead"""
    logger.debug("⚠️ Gemini LLM is disabled - using Groq instead")
    self._initialize_groq()
```

## Provider Comparison

| Feature | Gemini | Groq |
|---------|--------|------|
| Speed | Medium | Very Fast |
| Cost | Low | Very Low |
| Quality | High | High |
| Rate Limits | Generous | Generous |

## Testing

Test your LLM configuration:

```bash
# Start the server
python backend/main.py

# Test the agent
curl -X POST "http://localhost:8000/api/agent/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test the LLM"}'
```

Check the logs for LLM provider initialization messages:
- 🟢 = Gemini configured
- 🟠 = Groq configured