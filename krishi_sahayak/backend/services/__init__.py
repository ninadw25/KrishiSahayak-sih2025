"""
Services package for Agricultural AI Platform
Contains centralized services like LLM service
"""

from .llm_service import get_response

__all__ = ["get_response"]