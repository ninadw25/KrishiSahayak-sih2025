#!/usr/bin/env python3
"""
LangGraph Workflow - Agricultural AI Agent Graph
"""

from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict
import sys
from pathlib import Path

# Add paths for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

from schemas.agent_schema import AgentInput, AgentOutput
from ai_workflow.agent import AgriculturalAgent

class AgentState(TypedDict):
    """State for the agricultural agent graph"""
    messages: Annotated[List[Dict[str, Any]], add_messages]
    user_input: str
    session_id: str
    context: Dict[str, Any]
    tools_used: List[str]
    recommendations: Dict[str, Any]
    final_response: str

class AgriculturalAgentGraph:
    """LangGraph implementation for agricultural agent"""
    
    def __init__(self):
        self.agent = AgriculturalAgent()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow"""
        
        # Create the graph
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("process_input", self._process_input)
        workflow.add_node("execute_tools", self._execute_tools)
        workflow.add_node("generate_response", self._generate_response)
        
        # Add edges
        workflow.set_entry_point("process_input")
        workflow.add_edge("process_input", "execute_tools")
        workflow.add_edge("execute_tools", "generate_response")
        workflow.add_edge("generate_response", END)
        
        return workflow.compile()
    
    async def _process_input(self, state: AgentState) -> AgentState:
        """Process user input - simplified"""
        user_input = state["user_input"]
        
        # For now, just store the input - no complex tool analysis
        state["tools_used"] = []  # Placeholder
        state["context"] = state.get("context", {})
        
        return state
    
    async def _execute_tools(self, state: AgentState) -> AgentState:
        """Execute the required tools - placeholder for now"""
        # Simple placeholder - just call agent's execute_tools method
        user_input = state["user_input"]
        tool_results = self.agent.execute_tools(user_input)
        
        state["recommendations"] = tool_results
        return state
    
    async def _generate_response(self, state: AgentState) -> AgentState:
        """Generate final response using LLM"""
        user_input = state["user_input"]
        tool_results = state.get("recommendations", {})
        
        # Create agent input
        agent_input = AgentInput(
            message=user_input,
            session_id=state["session_id"],
            context=state.get("context", {})
        )
        
        # Process with agent
        agent_output = await self.agent.process_message(agent_input)
        
        state["final_response"] = agent_output.response
        state["messages"].append({
            "role": "assistant",
            "content": agent_output.response,
            "tools_used": agent_output.tools_used,
            "recommendations": agent_output.recommendations
        })
        
        return state
    
    async def run(self, user_input: str, session_id: str, context: Dict[str, Any] = None) -> AgentOutput:
        """Run the agricultural agent workflow"""
        
        initial_state = AgentState(
            messages=[{"role": "user", "content": user_input}],
            user_input=user_input,
            session_id=session_id,
            context=context or {},
            tools_used=[],
            recommendations={},
            final_response=""
        )
        
        # Run the graph
        final_state = await self.graph.ainvoke(initial_state)
        
        return AgentOutput(
            response=final_state["final_response"],
            tools_used=final_state["tools_used"],
            recommendations=final_state["recommendations"],
            session_id=session_id
        )
    
    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history"""
        return self.agent.get_conversation_history(session_id)
    
    def clear_memory(self, session_id: str):
        """Clear conversation memory"""
        self.agent.clear_memory(session_id)