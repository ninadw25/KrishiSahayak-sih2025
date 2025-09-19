#!/usr/bin/env python3
"""
LLM Service - Centralized language model service
Supports Gemini and Groq with easy switching
"""

import os
from typing import Optional, Dict, Any
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class LLMService:
    """Centralized LLM service with multiple provider support"""
    
    def __init__(self, provider: str = "gemini"):
        """
        Initialize LLM service
        
        Args:
            provider: "gemini" or "groq"
        """
        self.provider = provider
        self.llm = None
        logger.debug(f"🤖 Initializing LLM service with provider: {provider}")
        
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize the selected LLM provider"""
        try:
            if self.provider == "gemini":
                self._initialize_gemini()
            elif self.provider == "groq":
                self._initialize_groq()
            else:
                raise ValueError(f"Unsupported LLM provider: {self.provider}")
                
            logger.debug(f"✅ {self.provider.upper()} LLM initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize {self.provider} LLM: {str(e)}")
            raise e
    
    def _initialize_gemini(self):
        """Initialize Google Gemini LLM"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=api_key,
            temperature=0.1,
            convert_system_message_to_human=True
        )
        logger.debug("🟢 Gemini LLM configured")
    
    def _initialize_groq(self):
        """Initialize Groq LLM"""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        
        self.llm = ChatGroq(
            groq_api_key=api_key,
            model_name="mixtral-8x7b-32768",  # or "llama2-70b-4096"
            temperature=0.1
        )
        logger.debug("🟠 Groq LLM configured")
    
    # CONFIGURATION: Uncomment ONE of the options below to force a specific provider
    
    # OPTION 1: Force Gemini only - Uncomment the method below
    # def _initialize_groq(self):
    #     """Initialize Groq LLM - DISABLED, using Gemini instead"""
    #     logger.debug("⚠️ Groq LLM is disabled - using Gemini instead")
    #     self._initialize_gemini()
    
    # OPTION 2: Force Groq only - Uncomment the method below  
    # def _initialize_gemini(self):
    #     """Initialize Google Gemini LLM - DISABLED, using Groq instead"""
    #     logger.debug("⚠️ Gemini LLM is disabled - using Groq instead")
    #     self._initialize_groq()
    
    async def generate_response(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Generate response from LLM
        
        Args:
            prompt: User prompt/question
            system_message: Optional system message for context
            
        Returns:
            Generated response string
        """
        logger.debug(f"🔄 Generating response with {self.provider}")
        logger.debug(f"📝 Prompt: {prompt[:100]}...")
        
        try:
            if system_message:
                messages = [
                    SystemMessage(content=system_message),
                    HumanMessage(content=prompt)
                ]
            else:
                messages = [HumanMessage(content=prompt)]
            
            response = await self.llm.ainvoke(messages)
            
            logger.debug(f"✅ Response generated successfully ({len(response.content)} chars)")
            return response.content
            
        except Exception as e:
            logger.error(f"❌ LLM generation failed: {str(e)}")
            # Fallback response
            return f"I apologize, but I'm having trouble processing your request right now. Error: {str(e)}"
    
    def generate_response_sync(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Synchronous version of generate_response
        
        Args:
            prompt: User prompt/question
            system_message: Optional system message for context
            
        Returns:
            Generated response string
        """
        logger.debug(f"🔄 Generating sync response with {self.provider}")
        
        try:
            if system_message:
                messages = [
                    SystemMessage(content=system_message),
                    HumanMessage(content=prompt)
                ]
            else:
                messages = [HumanMessage(content=prompt)]
            
            response = self.llm.invoke(messages)
            
            logger.debug(f"✅ Sync response generated successfully")
            return response.content
            
        except Exception as e:
            logger.error(f"❌ Sync LLM generation failed: {str(e)}")
            return f"I apologize, but I'm having trouble processing your request right now. Error: {str(e)}"
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about the current LLM provider"""
        return {
            "provider": self.provider,
            "model": getattr(self.llm, 'model_name', 'unknown') if hasattr(self.llm, 'model_name') else getattr(self.llm, 'model', 'unknown'),
            "status": "initialized" if self.llm else "not_initialized"
        }

# Global LLM service instance
_llm_service = None

def get_llm_service(provider: str = "gemini") -> LLMService:
    """
    Get or create global LLM service instance
    
    Args:
        provider: "gemini" or "groq"
        
    Returns:
        LLMService instance
    """
    global _llm_service
    
    if _llm_service is None or _llm_service.provider != provider:
        logger.debug(f"🔄 Creating new LLM service with provider: {provider}")
        _llm_service = LLMService(provider=provider)
    
    return _llm_service

# Convenience functions for easy usage
async def generate_agricultural_response(prompt: str, context: Optional[str] = None) -> str:
    """
    Generate agricultural AI response
    
    Args:
        prompt: User question/prompt
        context: Optional context information
        
    Returns:
        AI response
    """
    system_message = """You are an expert agricultural AI assistant. You help farmers with:
    
    - Crop recommendations based on soil, location, and season
    - Fertilizer recommendations for specific crops and soil conditions
    - Soil health analysis and advice
    - Weather information and agricultural guidance
    - Crop price information and market trends
    - Government schemes and general agricultural FAQs
    
    Always:
    - Be helpful and provide practical advice
    - Explain your reasoning clearly
    - Give actionable recommendations
    - Use simple, farmer-friendly language
    - Be encouraging and supportive
    
    If you don't have specific information, be honest about it and suggest where they might find help."""
    
    if context:
        full_prompt = f"Context: {context}\n\nQuestion: {prompt}"
    else:
        full_prompt = prompt
    
    llm_service = get_llm_service()
    return await llm_service.generate_response(full_prompt, system_message)

def generate_agricultural_response_sync(prompt: str, context: Optional[str] = None) -> str:
    """
    Synchronous version of generate_agricultural_response
    """
    system_message = """You are an expert agricultural AI assistant. You help farmers with crop recommendations, fertilizer advice, soil health, weather guidance, prices, and government schemes. Always be helpful, practical, and use simple language."""
    
    if context:
        full_prompt = f"Context: {context}\n\nQuestion: {prompt}"
    else:
        full_prompt = prompt
    
    llm_service = get_llm_service()
    return llm_service.generate_response_sync(full_prompt, system_message)