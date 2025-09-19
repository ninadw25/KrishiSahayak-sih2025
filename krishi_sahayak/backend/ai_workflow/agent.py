#!/usr/bin/env python3
"""
Agricultural AI Agent - LangGraph implementation
Single intelligent agent with multiple agricultural tools
"""

from typing import Dict, List, Any, Optional
from langchain_core.tools import BaseTool
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain.memory import ConversationBufferMemory
import sys
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add paths for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from schemas.agent_schema import *
from .tools.agricultural_tools import (
    CropRecommendationTool,
    FertilizerRecommendationTool,
    SoilHealthTool,
    WeatherTool,
    PriceTool,
    RAGTool
)
from services.llm_service import get_llm_service

class AgriculturalAgent:
    """Main agricultural AI agent using LangGraph"""
    
    def __init__(self, llm_provider: str = "gemini"):
        logger.debug(f"🤖 Initializing AgriculturalAgent with provider: {llm_provider}")
        
        try:
            self.llm_service = get_llm_service(provider=llm_provider)
            logger.debug("✅ LLM service initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize LLM service: {str(e)}")
            raise e
        
        self.memory = ConversationBufferMemory(return_messages=True)
        logger.debug("✅ Memory initialized")
        
        # Initialize tools
        logger.debug("🔧 Initializing tools...")
        try:
            self.tools = {
                "crop_recommendation": CropRecommendationTool(),
                "fertilizer_recommendation": FertilizerRecommendationTool(),
                "soil_health": SoilHealthTool(),
                "weather": WeatherTool(),
                "price": PriceTool(),
                "rag": RAGTool()
            }
            logger.debug(f"✅ Initialized {len(self.tools)} tools: {list(self.tools.keys())}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize tools: {str(e)}")
            raise e
        
        # System message for LLM
        self.system_message = """You are an expert agricultural AI assistant. You help farmers with:
        
        1. Crop recommendations based on soil, location, and season
        2. Fertilizer recommendations for specific crops and soil conditions
        3. Soil health analysis and advice
        4. Weather information and agricultural guidance
        5. Crop price information and market trends
        6. Government schemes and general agricultural FAQs
        
        Available tools provide you with data:
        - crop_recommendation: Crop suggestions based on location and soil
        - fertilizer_recommendation: Fertilizer advice for crops
        - soil_health: Soil condition analysis and health advice
        - weather: Weather information and agricultural guidance
        - price: Crop prices and market trends
        - rag: Government schemes and general agricultural FAQs
        
        Always:
        - Be helpful and provide practical advice
        - Use the tool results when available
        - Explain your reasoning clearly
        - Give actionable recommendations
        - Ask for clarification if information is missing
        - Respond in a natural, conversational way
        - Use simple, farmer-friendly language"""
    
    def _determine_tools_needed(self, message: str) -> List[str]:
        """Determine which tools are needed based on the user message"""
        logger.debug(f"🔍 Analyzing message for tool selection: '{message}'")
        
        message_lower = message.lower()
        tools_needed = []
        
        # Crop recommendation keywords
        crop_keywords = ["what crop", "which crop", "crop recommendation", "what to plant", "should i plant"]
        if any(word in message_lower for word in crop_keywords):
            tools_needed.append("crop_recommendation")
            logger.debug("🌾 Detected crop recommendation need")
        
        # Fertilizer recommendation keywords
        fertilizer_keywords = ["fertilizer", "fertiliser", "nutrients", "npk", "dosage"]
        if any(word in message_lower for word in fertilizer_keywords):
            tools_needed.append("fertilizer_recommendation")
            logger.debug("🧪 Detected fertilizer recommendation need")
        
        # Soil health keywords
        soil_keywords = ["soil health", "soil condition", "soil quality", "how is my soil"]
        if any(word in message_lower for word in soil_keywords):
            tools_needed.append("soil_health")
            logger.debug("🌱 Detected soil health analysis need")
        
        # Weather keywords
        weather_keywords = ["weather", "temperature", "rain", "climate"]
        if any(word in message_lower for word in weather_keywords):
            tools_needed.append("weather")
            logger.debug("🌤️ Detected weather information need")
        
        # Price keywords
        price_keywords = ["price", "market", "cost", "sell", "buy"]
        if any(word in message_lower for word in price_keywords):
            tools_needed.append("price")
            logger.debug("💰 Detected price information need")
        
        # Government schemes and FAQ keywords
        rag_keywords = ["government", "scheme", "subsidy", "irrigation", "loan", "policy"]
        if any(word in message_lower for word in rag_keywords):
            tools_needed.append("rag")
            logger.debug("📋 Detected RAG/FAQ need")
        
        logger.debug(f"🎯 Selected tools: {tools_needed}")
        return tools_needed
    
    def _extract_parameters(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract parameters from message and context for tool calls"""
        # This is a simplified parameter extraction
        # In production, you'd use NER or more sophisticated parsing
        
        params = {}
        
        # Try to extract from context first
        if context:
            params.update(context)
        
        # Basic keyword extraction (can be enhanced with NLP)
        message_lower = message.lower()
        
        # Extract crop names
        crops = ["rice", "wheat", "maize", "cotton", "sugarcane", "potato", "tomato"]
        for crop in crops:
            if crop in message_lower:
                params["crop"] = crop
                break
        
        # Extract seasons
        seasons = ["kharif", "rabi", "summer", "monsoon"]
        for season in seasons:
            if season in message_lower:
                params["season"] = season
                break
        
        return params
    
    async def process_message(self, agent_input: AgentInput) -> AgentOutput:
        """Process user message and return response"""
        logger.debug(f"📨 Processing message: '{agent_input.message}' for session: {agent_input.session_id}")
        
        try:
            # Determine which tools to use
            logger.debug("🔍 Determining tools needed...")
            tools_needed = self._determine_tools_needed(agent_input.message)
            
            # Extract parameters
            logger.debug("📝 Extracting parameters...")
            params = self._extract_parameters(agent_input.message, agent_input.context or {})
            logger.debug(f"📋 Extracted params: {params}")
            
            # Execute tools
            logger.debug(f"🔧 Executing {len(tools_needed)} tools...")
            tool_results = {}
            for tool_name in tools_needed:
                if tool_name in self.tools:
                    try:
                        logger.debug(f"⚙️ Calling tool: {tool_name}")
                        result = await self._call_tool(tool_name, params)
                        tool_results[tool_name] = result
                        logger.debug(f"✅ Tool {tool_name} completed successfully")
                    except Exception as e:
                        logger.error(f"❌ Tool {tool_name} failed: {str(e)}")
                        tool_results[tool_name] = f"Error: {str(e)}"
                else:
                    logger.warning(f"⚠️ Tool {tool_name} not found in available tools")
            
            # Generate response using LLM service
            logger.debug("🤖 Generating LLM response...")
            context_info = ""
            if tool_results:
                context_info = f"\n\nTool Results: {tool_results}"
            
            user_prompt = f"{agent_input.message}{context_info}"
            
            try:
                response_content = await self.llm_service.generate_response(
                    prompt=user_prompt,
                    system_message=self.system_message
                )
                logger.debug("✅ LLM response generated successfully")
            except Exception as e:
                logger.error(f"❌ LLM invocation failed: {str(e)}")
                # Fallback response
                response_content = f"Based on your question about {agent_input.message}, here's what I found: {tool_results if tool_results else 'I can help you with agricultural questions.'}"
            
            # Store in memory
            logger.debug("💾 Storing conversation in memory...")
            self.memory.chat_memory.add_user_message(agent_input.message)
            self.memory.chat_memory.add_ai_message(response_content)
            
            result = AgentOutput(
                response=response_content,
                tools_used=tools_needed,
                recommendations=tool_results,
                session_id=agent_input.session_id
            )
            
            logger.debug(f"✅ Message processing complete. Response length: {len(response_content)}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Message processing failed: {str(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            
            return AgentOutput(
                response=f"I apologize, but I encountered an error: {str(e)}. Please try again.",
                tools_used=[],
                recommendations=None,
                session_id=agent_input.session_id
            )
    
    async def _call_tool(self, tool_name: str, params: Dict[str, Any]) -> Any:
        """Call a specific tool with parameters"""
        tool = self.tools[tool_name]
        
        if tool_name == "crop_recommendation":
            # Extract required parameters for crop recommendation
            tool_input = CropRecommendationToolInput(
                state=params.get("state", ""),
                district=params.get("district", ""),
                prev_crop=params.get("prev_crop", ""),
                land_size=params.get("land_size", 1.0),
                season=params.get("season", "kharif"),
                soil_properties=params.get("soil_properties", SoilProperties(N=50, P=30, K=40, ph=6.5))
            )
            return await tool.arun(tool_input)
        
        elif tool_name == "fertilizer_recommendation":
            tool_input = FertilizerRecommendationToolInput(
                crop=params.get("crop", "rice"),
                soil_properties=params.get("soil_properties", SoilProperties(N=50, P=30, K=40, ph=6.5))
            )
            return await tool.arun(tool_input)
        
        elif tool_name == "soil_health":
            tool_input = SoilHealthToolInput(
                soil_properties=params.get("soil_properties", SoilProperties(N=50, P=30, K=40, ph=6.5)),
                crop=params.get("crop")
            )
            return await tool.arun(tool_input)
        
        elif tool_name == "weather":
            tool_input = WeatherToolInput(
                location=params.get("location", params.get("state", "India"))
            )
            return await tool.arun(tool_input)
        
        elif tool_name == "price":
            tool_input = PriceToolInput(
                crop=params.get("crop", "rice"),
                location=params.get("location")
            )
            return await tool.arun(tool_input)
        
        elif tool_name == "rag":
            tool_input = RAGToolInput(
                query=params.get("query", ""),
                context_type="general_faq"
            )
            return await tool.arun(tool_input)
        
        return None
    
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