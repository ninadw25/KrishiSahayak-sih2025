#!/usr/bin/env python3
"""
Super Simple Agricultural AI Agent
Just uses LLM calls - no complex tools
"""

from typing import Dict, List, Any
from langchain.memory import ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage
import sys
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add paths for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from schemas.agent_schema import AgentInput, AgentOutput
from services.llm_service import get_response

class AgriculturalAgent:
    """Super simple agricultural AI agent"""
    
    def __init__(self):
        logger.debug("🤖 Initializing Simple AgriculturalAgent")
        
        self.memory = ConversationBufferMemory(return_messages=True)
        logger.debug("✅ Memory initialized")
        
        # Simple system message
        self.system_message = """You are an expert agricultural AI assistant. Help farmers with:
        
        - Crop recommendations based on soil, location, and season
        - Fertilizer recommendations for specific crops and soil conditions  
        - Soil health analysis and advice
        - Weather information and agricultural guidance
        - Crop price information and market trends
        - Government schemes and general agricultural FAQs
        
        Always be helpful, provide practical advice, and use simple farmer-friendly language."""
        
        logger.debug("✅ Agent initialized successfully")
    
    def execute_tools(self, message: str) -> Dict[str, Any]:
        """
        Placeholder for tool execution - to be implemented later
        For now, just returns empty dict
        """
        logger.debug("🔧 Execute tools called (placeholder)")
        # TODO: Add tool logic here later
        return {}
    
    async def process_message(self, agent_input: AgentInput) -> AgentOutput:
        """Process user message and return response"""
        logger.debug(f"📨 Processing message: '{agent_input.message}'")
        
        try:
            # Execute tools (placeholder for now)
            tool_results = self.execute_tools(agent_input.message)
            
            # Prepare context for LLM
            context_info = ""
            if tool_results:
                context_info = f"\n\nAdditional Context: {tool_results}"
            
            user_prompt = f"{agent_input.message}{context_info}"
            
            # Get LLM response
            logger.debug("🤖 Getting LLM response...")
            response_content = get_response(
                prompt=user_prompt,
                system_message=self.system_message
            )
            logger.debug("✅ LLM response generated")
            
            # Store in memory
            self.memory.chat_memory.add_user_message(agent_input.message)
            self.memory.chat_memory.add_ai_message(response_content)
            
            return AgentOutput(
                response=response_content,
                tools_used=[],  # No tools for now
                recommendations=tool_results,
                session_id=agent_input.session_id
            )
            
        except Exception as e:
            logger.error(f"❌ Error processing message: {str(e)}")
            return AgentOutput(
                response=f"Sorry, I encountered an error: {str(e)}. Please try again.",
                tools_used=[],
                recommendations={},
                session_id=agent_input.session_id
            )
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for a session"""
        messages = self.memory.chat_memory.messages
        history = []
        
        for message in messages:
            if isinstance(message, HumanMessage):
                history.append({"role": "user", "content": message.content})
            elif isinstance(message, AIMessage):
                history.append({"role": "assistant", "content": message.content})
        
        return history
    
    def clear_memory(self, session_id: str):
        """Clear conversation memory for a session"""
        self.memory.clear()
        logger.debug("🗑️ Memory cleared")