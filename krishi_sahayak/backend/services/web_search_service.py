"""
Web Search Service using Tavily API
Simple web search functionality for the agricultural AI agent
"""

import os
import logging
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class WebSearchService:
    """Simple web search service using Tavily API"""
    
    def __init__(self):
        self.api_key = os.getenv('TAVILY_API_KEY')
        if not self.api_key:
            logger.warning("⚠️ TAVILY_API_KEY not found in environment variables")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("✅ Tavily web search service initialized")
    
    def search(self, query: str, max_results: int = 1) -> Dict[str, Any]:
        """
        Search the web using Tavily API
        
        Args:
            query: Search query string
            max_results: Maximum number of results to return
            
        Returns:
            Dictionary containing search results
        """
        if not self.enabled:
            return {
                "success": False,
                "message": "Web search not available - API key missing",
                "results": []
            }
        
        try:
            # Import here to avoid issues if package not installed
            from langchain_tavily import TavilySearch
            
            # Initialize Tavily search tool
            search_tool = TavilySearch(
                max_results=max_results,
                topic="general",
                include_answer=True,  # Include AI-generated answer
                search_depth="basic"
            )
            
            # Perform search
            logger.info(f"🔍 Searching web for: {query}")
            search_result = search_tool.invoke({"query": query})
            
            # Parse results
            if isinstance(search_result, str):
                import json
                try:
                    search_data = json.loads(search_result)
                except json.JSONDecodeError:
                    search_data = {"results": [], "answer": search_result}
            else:
                search_data = search_result
            
            # Format response
            formatted_results = []
            if "results" in search_data:
                for result in search_data["results"][:max_results]:
                    formatted_results.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": result.get("content", "")[:300] + "..." if len(result.get("content", "")) > 300 else result.get("content", "")
                    })
            
            response = {
                "success": True,
                "query": query,
                "answer": search_data.get("answer", ""),
                "results": formatted_results,
                "total_results": len(formatted_results)
            }
            
            logger.info(f"✅ Found {len(formatted_results)} search results")
            return response
            
        except ImportError:
            logger.error("❌ langchain-tavily package not installed")
            return {
                "success": False,
                "message": "Web search package not available",
                "results": []
            }
        except Exception as e:
            logger.error(f"❌ Web search error: {str(e)}")
            return {
                "success": False,
                "message": f"Search failed: {str(e)}",
                "results": []
            }
    
    def search_agricultural_info(self, query: str) -> str:
        """
        Search for agricultural information and return formatted response
        
        Args:
            query: Agricultural search query
            
        Returns:
            Formatted string with search results
        """
        # Add agricultural context to query
        agricultural_query = f"agriculture farming {query} India"
        
        search_results = self.search(agricultural_query, max_results=1)
        
        if not search_results["success"]:
            return f"I couldn't search the web right now: {search_results['message']}"
        
        # Format response
        response_parts = []
        
        # Add AI answer if available
        if search_results.get("answer"):
            response_parts.append(f"🌐 **Web Search Results:**\n{search_results['answer']}")
        
        # Add search results
        if search_results["results"]:
            response_parts.append("\n📚 **Sources:**")
            for i, result in enumerate(search_results["results"], 1):
                response_parts.append(f"{i}. **{result['title']}**")
                response_parts.append(f"   {result['content']}")
                response_parts.append(f"   🔗 {result['url']}\n")
        
        if not response_parts:
            response_parts.append("No relevant information found in web search.")
        
        return "\n".join(response_parts)

# Global web search service instance
web_search_service = WebSearchService()

def search_web(query: str, max_results: int = 1) -> Dict[str, Any]:
    """
    Simple function to search the web
    
    Args:
        query: Search query
        max_results: Maximum results to return
        
    Returns:
        Search results dictionary
    """
    return web_search_service.search(query, max_results)

def get_agricultural_info(query: str) -> str:
    """
    Get agricultural information from web search
    
    Args:
        query: Agricultural query
        
    Returns:
        Formatted agricultural information
    """
    return web_search_service.search_agricultural_info(query)