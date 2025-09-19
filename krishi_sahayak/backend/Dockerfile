# Use Python 3.11 slim base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip first
RUN pip install --upgrade pip

# Install core dependencies first (most stable)
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    pydantic \
    python-dotenv \
    requests

# Install ML dependencies
RUN pip install --no-cache-dir \
    pandas \
    numpy \
    scikit-learn \
    torch \
    torchvision \
    ultralytics

# Install LLM dependencies
RUN pip install --no-cache-dir \
    langchain \
    langchain-google-genai \
    langchain-groq

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
