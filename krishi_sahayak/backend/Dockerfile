# Use Python 3.11 slim base image for smaller size
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirements file first (for Docker layer caching optimization)
# This way dependencies are only reinstalled when requirements.txt changes
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir keeps the image size smaller
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# First '.' = copy from current directory on host
# Second '.' = paste to current working directory (/app) in container
COPY . .

# Expose the port that FastAPI will run on
EXPOSE 8000

# Command to run the application
# --host 0.0.0.0 makes server accessible from outside container
# --reload enables auto-reload for development (remove for production)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
