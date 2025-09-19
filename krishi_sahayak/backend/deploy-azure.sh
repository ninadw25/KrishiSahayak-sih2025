#!/bin/bash

# Azure Deployment Script for Agricultural AI Backend
# Make sure you have Azure CLI installed and logged in

set -e

# Configuration
RESOURCE_GROUP="agricultural-ai-rg"
APP_SERVICE_PLAN="agricultural-ai-plan"
WEB_APP_NAME="agricultural-ai-backend"
LOCATION="East US"
DOCKER_IMAGE_NAME="agricultural-ai-backend"

echo "🚀 Starting Azure deployment for Agricultural AI Backend..."

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create App Service Plan (Linux, B1 tier)
echo "📋 Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku B1 \
    --is-linux

# Create Web App with Docker container
echo "🌐 Creating Web App..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $WEB_APP_NAME \
    --deployment-container-image-name $DOCKER_IMAGE_NAME

# Configure app settings
echo "⚙️ Configuring app settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --settings \
        WEBSITES_PORT=8000 \
        PYTHONPATH=/app \
        MODEL_VERSION=v2.0 \
        MIN_FUZZY_SCORE=80

# Set environment variables (you'll need to set these manually or via script)
echo "🔑 Setting up environment variables..."
echo "Please set the following environment variables in Azure Portal:"
echo "- GOOGLE_API_KEY"
echo "- GROQ_API_KEY"
echo "- RAPIDAPI_WEATHER_KEY"
echo "- MAPBOX_ACCESS_TOKEN"

# Enable logging
echo "📊 Enabling application logging..."
az webapp log config \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --application-logging true \
    --level information

# Show deployment info
echo "✅ Deployment completed!"
echo "🌐 Web App URL: https://$WEB_APP_NAME.azurewebsites.net"
echo "📊 Health Check: https://$WEB_APP_NAME.azurewebsites.net/health"
echo "📚 API Docs: https://$WEB_APP_NAME.azurewebsites.net/docs"
echo "🤖 AI Agent: https://$WEB_APP_NAME.azurewebsites.net/api/agent/chat"

echo ""
echo "🔧 Next steps:"
echo "1. Set environment variables in Azure Portal"
echo "2. Upload your Docker image to Azure Container Registry"
echo "3. Configure continuous deployment"
echo ""
echo "📖 For detailed instructions, see: https://docs.microsoft.com/en-us/azure/app-service/"