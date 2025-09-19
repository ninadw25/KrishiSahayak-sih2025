#!/usr/bin/env python3
"""
Agent Routes - FastAPI routes for the agricultural AI agent
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List
import sys
from pathlib import Path
import uuid
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add paths for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from schemas.agent_schema import ChatInput, ChatOutput, AgentInput, AgentOutput
from ai_workflow.graph import AgriculturalAgentGraph

# Create router
agent_router = APIRouter()

# Global agent instance and session storage
agent_graph = None
active_sessions = {}  # Store session data

def get_agent_graph():
    """Get or initialize the agent graph"""
    global agent_graph
    logger.debug("🤖 Getting agent graph...")
    
    if agent_graph is None:
        logger.debug("🔄 Initializing new agent graph...")
        try:
            agent_graph = AgriculturalAgentGraph()
            logger.debug("✅ Agent graph initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize agent graph: {str(e)}")
            raise e
    else:
        logger.debug("✅ Using existing agent graph")
    
    return agent_graph

@agent_router.post("/chat", response_model=ChatOutput)
async def chat_with_agent(chat_input: ChatInput):
    """Simple chat endpoint for frontend - just message in, response out"""
    logger.debug(f"💬 Received chat message: '{chat_input.message}'")
    
    try:
        # Generate or get session ID
        session_id = str(uuid.uuid4())
        logger.debug(f"🆔 Generated session ID: {session_id}")
        
        # Get agent graph
        graph = get_agent_graph()
        logger.debug("🤖 Got agent graph, processing message...")
        
        # Create internal agent input
        agent_input = AgentInput(
            message=chat_input.message,
            session_id=session_id,
            context={}
        )
        logger.debug(f"📝 Created agent input: {agent_input}")
        
        # Process with agent
        logger.debug("🔄 Running agent workflow...")
        result = await graph.run(
            user_input=agent_input.message,
            session_id=session_id,
            context={}
        )
        logger.debug(f"✅ Agent processing complete. Tools used: {result.tools_used}")
        
        # Store session info
        active_sessions[session_id] = {
            "last_message": chat_input.message,
            "last_response": result.response,
            "tools_used": result.tools_used
        }
        logger.debug(f"💾 Stored session data for {session_id}")
        
        # Return simple response
        response = ChatOutput(
            response=result.response,
            session_id=session_id
        )
        logger.debug(f"📤 Sending response: '{response.response[:100]}...'")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Agent processing failed: {str(e)}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        
        # Return error response instead of raising exception
        return ChatOutput(
            response=f"I apologize, but I encountered an error: {str(e)}. Please try again.",
            session_id=str(uuid.uuid4())
        )

@agent_router.get("/sessions")
async def get_active_sessions():
    """Get list of active sessions (for debugging)"""
    logger.debug(f"📋 Retrieving active sessions. Count: {len(active_sessions)}")
    
    try:
        return {
            "active_sessions": len(active_sessions),
            "sessions": list(active_sessions.keys())
        }
    except Exception as e:
        logger.error(f"❌ Error retrieving sessions: {str(e)}")
        return {"error": str(e)}

@agent_router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get information about a specific session"""
    logger.debug(f"🔍 Getting session info for: {session_id}")
    
    try:
        if session_id in active_sessions:
            return {
                "session_id": session_id,
                "session_data": active_sessions[session_id]
            }
        else:
            return {
                "session_id": session_id,
                "message": "Session not found"
            }
    except Exception as e:
        logger.error(f"❌ Error retrieving session {session_id}: {str(e)}")
        return {"error": str(e)}

@agent_router.get("/status")
async def get_agent_status():
    """Get agent system status"""
    try:
        graph = get_agent_graph()
        
        return {
            "status": "operational",
            "agent_loaded": graph is not None,
            "available_tools": [
                "crop_recommendation",
                "fertilizer_recommendation", 
                "soil_health",
                "weather",
                "price",
                "rag"
            ],
            "features": [
                "Natural language conversation",
                "Multi-tool integration",
                "Conversation memory",
                "Agricultural expertise"
            ]
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }