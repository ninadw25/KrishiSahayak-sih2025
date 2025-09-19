"""
Routes package for Agricultural AI Platform
Contains all API route definitions organized by feature
"""

from .fertilizer_routes import fertilizer_router
from .agent_routes import agent_router

__all__ = ["fertilizer_router", "agent_router"]
