#!/usr/bin/env python3
"""
Agricultural AI Agent with Web Search
Uses web search to get latest agricultural information
"""

import logging
from typing import Dict, List, Any
from langchain.memory import ConversationBufferMemory
from pathlib import Path
import sys

# Add current directory to path for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from services.llm_service import get_response
from services.web_search_service import get_agricultural_info
from ai_workflow.tools.tool_functions import crop_recommendation_tool, fertilizer_recommendation_tool

logger = logging.getLogger(__name__)

class AgriculturalAgent:
    """Enhanced Agricultural AI Agent with Web Search and Tools"""
    
    def __init__(self):
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Available tools
        self.tools = {
            "crop_recommendation": crop_recommendation_tool,
            "fertilizer_recommendation": fertilizer_recommendation_tool,
            "web_search": get_agricultural_info
        }
        
        logger.info("🤖 Agricultural Agent initialized with web search and tools")
    
    def process_message(self, user_message: str, chat_history: List[Dict] = None) -> str:
        """
        Process user message with web search and tool calling
        
        Args:
            user_message: User's input message
            chat_history: Previous conversation history
            
        Returns:
            Agent's response
        """
        try:
            # Step 1: Analyze if user needs specific tools
            tool_response = self._check_and_use_tools(user_message)
            
            # Step 2: Always search web for additional context
            web_info = get_agricultural_info(user_message)
            
            # Step 3: Generate enhanced prompt with all information
            enhanced_prompt = self._create_enhanced_prompt(
                user_message, tool_response, web_info, chat_history
            )
            
            # Step 4: Get LLM response
            response = get_response(enhanced_prompt)
            
            # Step 5: Store in memory
            self.memory.chat_memory.add_user_message(user_message)
            self.memory.chat_memory.add_ai_message(response)
            
            logger.info("✅ Agent processed message successfully")
            return response
            
        except Exception as e:
            logger.error(f"❌ Agent error: {str(e)}")
            return f"I encountered an error while processing your request: {str(e)}. Please try again."
    
    def _check_and_use_tools(self, user_message: str) -> str:
        """Check if user message requires specific tools and use them"""
        message_lower = user_message.lower()
        tool_results = []
        
        # Check for crop recommendation keywords
        crop_keywords = ["crop recommendation", "what crop", "which crop", "suggest crop", "recommend crop"]
        if any(keyword in message_lower for keyword in crop_keywords):
            try:
                # Extract basic parameters (you can enhance this with NLP)
                # For now, use default values - in production, you'd parse the message
                crop_result = crop_recommendation_tool(
                    state="Punjab",  # Default - enhance with message parsing
                    district="Ludhiana",
                    temperature=25.0,
                    humidity=60.0,
                    rainfall_mm=100.0,
                    season="kharif",
                    wind_speed=5.0,
                    pressure=1013.0
                )
                tool_results.append(f"🌾 **Crop Recommendation Results:**\n{crop_result}")
            except Exception as e:
                logger.error(f"Crop tool error: {e}")
        
        # Check for fertilizer recommendation keywords
        fertilizer_keywords = ["fertilizer", "nutrient", "soil nutrition", "npk", "fertiliser"]
        if any(keyword in message_lower for keyword in fertilizer_keywords):
            try:
                fertilizer_result = fertilizer_recommendation_tool(
                    crop_type="Rice",  # Default - enhance with message parsing
                    soil_type="Loamy",
                    nitrogen=20.0,
                    phosphorus=15.0,
                    potassium=25.0
                )
                tool_results.append(f"🧪 **Fertilizer Recommendation Results:**\n{fertilizer_result}")
            except Exception as e:
                logger.error(f"Fertilizer tool error: {e}")
        
        return "\n\n".join(tool_results) if tool_results else ""
    
    def _create_enhanced_prompt(self, user_message: str, tool_response: str, web_info: str, chat_history: List[Dict] = None) -> str:
        """Create enhanced prompt with all available information"""
        
        system_context = """You are an expert Agricultural AI Assistant specializing in Indian farming practices. 
        You have access to:
        Real-time web search results for latest agricultural information
        
        Your responses should be:
        - Practical and actionable for Indian farmers
        - Based on the latest information from web search
        - Enhanced with tool results when available
        - Clear and easy to understand
        - Focused on sustainable farming practices
        - Clear and concise and not too long
        
        Always prioritize farmer safety and sustainable agriculture. """
        
        # Build the enhanced prompt
        prompt_parts = [system_context]
        
        # Add chat history if available
        if chat_history:
            prompt_parts.append("\nPrevious conversation:")
            for msg in chat_history[-3:]:  # Last 3 messages for context
                role = msg.get("role", "")
                content = msg.get("content", "")
                prompt_parts.append(f"{role.capitalize()}: {content}")
        
        # Add tool results if available
        if tool_response:
            prompt_parts.append(f"\nTool Analysis Results:\n{tool_response}")
        
        # Add web search results
        if web_info and "No relevant information found" not in web_info:
            prompt_parts.append(f"\nLatest Web Information:\n{web_info}")
        
        # Add user question
        prompt_parts.append(f"\nUser Question: {user_message}")
        
        # Add instructions
        prompt_parts.append("""
        Please provide a comprehensive response that:
        1. Directly answers the user's question
        2. Incorporates the latest web information
        3. Uses tool results if relevant
        4. Provides practical recommendations
        5. Mentions sources when appropriate
        
        Response:""")
        
        return "\n".join(prompt_parts)
    
    def get_memory_context(self) -> str:
        """Get conversation history for context"""
        try:
            messages = self.memory.chat_memory.messages
            if not messages:
                return ""
            
            context_parts = []
            for message in messages[-6:]:  # Last 6 messages
                if hasattr(message, 'content'):
                    role = "Human" if hasattr(message, 'type') and message.type == "human" else "Assistant"
                    context_parts.append(f"{role}: {message.content}")
            
            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Memory context error: {e}")
            return ""
    
    def clear_memory(self):
        """Clear conversation memory"""
        self.memory.clear()
        logger.info("🧹 Agent memory cleared")

# Global agent instance
agricultural_agent = AgriculturalAgent()

def process_agricultural_query(user_message: str, chat_history: List[Dict] = None) -> str:
    """
    Simple function to process agricultural queries with web search
    
    Args:
        user_message: User's question
        chat_history: Previous conversation
        
    Returns:
        Agent's response with web search results
    """
    return agricultural_agent.process_message(user_message, chat_history)