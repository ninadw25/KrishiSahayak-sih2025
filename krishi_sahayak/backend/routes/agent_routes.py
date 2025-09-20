#!/usr/bin/env python3
"""
Agent Routes - FastAPI routes for the agricultural AI agent with web search
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List
from pathlib import Path
from datetime import datetime
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add current directory to Python path for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from schemas.agent_schema import ChatRequest, ChatResponse
from ai_workflow.agent import process_agricultural_query

# Create router
agent_router = APIRouter(prefix="/agent", tags=["Agricultural AI Agent"])

@agent_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    """
    Chat with the agricultural AI agent
    - Enhanced with web search for latest information
    - Includes crop and fertilizer recommendation tools
    - Provides practical farming advice
    """
    try:
        logger.info(f"🤖 Processing chat request: {request.message[:100]}...")
        
        # Process the message with web search and tools
        response = process_agricultural_query(
            user_message=request.message,
            chat_history=request.chat_history or []
        )
        
        # Generate timestamp if not provided
        timestamp = request.timestamp or datetime.now().isoformat()
        
        return ChatResponse(
            success=True,
            message="Response generated successfully",
            response=response,
            sources=["Web Search", "Agricultural Tools", "LLM Knowledge"],
            timestamp=timestamp
        )
        
    except Exception as e:
        logger.error(f"❌ Chat error: {str(e)}")
        
        # Generate timestamp for error response
        timestamp = request.timestamp or datetime.now().isoformat()
        
        return ChatResponse(
            success=False,
            message=f"Chat processing failed: {str(e)}",
            response="I'm sorry, I encountered an error while processing your request. Please try again.",
            sources=[],
            timestamp=timestamp
        )

@agent_router.get("/health")
async def health_check():
    """Check agent service health"""
    try:
        # Test web search service
        from services.web_search_service import web_search_service
        web_status = "available" if web_search_service.enabled else "unavailable"
        
        return {
            "status": "healthy",
            "message": "Agricultural AI Agent is running",
            "features": {
                "web_search": web_status,
                "crop_recommendations": "available",
                "fertilizer_recommendations": "available",
                "llm_service": "available"
            },
            "version": "2.0.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@agent_router.get("/test")
async def test_agent():
    """Test agent with sample query"""
    try:
        test_query = "What are the best crops for monsoon season in Punjab?"
        
        response = process_agricultural_query(test_query)
        
        return {
            "success": True,
            "test_query": test_query,
            "response": response,
            "message": "Agent test completed successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Agent test failed: {str(e)}"
        }