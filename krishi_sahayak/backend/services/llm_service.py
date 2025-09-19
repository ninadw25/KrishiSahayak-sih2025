"""
Super Simple LLM Service
"""

import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# Load environment variables
load_dotenv()

# Configuration - Change this to 'google' or 'groq'
MAIN_LLM = 'google'
# MAIN_LLM = 'groq'

def get_response(prompt: str, system_message: str = None) -> str:
    """
    Get response from LLM (Google or Groq based on MAIN_LLM setting)
    """
    try:
        # Initialize LLM based on config
        if MAIN_LLM == 'google':
            llm = ChatGoogleGenerativeAI(
                # model="gemini-pro",
                model="gemini-1.5-flash",
                google_api_key=os.getenv("GOOGLE_API_KEY"),
                temperature=0.1,
                convert_system_message_to_human=True
            )
        elif MAIN_LLM == 'groq':
            llm = ChatGroq(
                groq_api_key=os.getenv("GROQ_API_KEY"),
                model_name="llama3-8b-8192",
                temperature=0.1
            )
        else:
            return "Error: Invalid LLM configuration"
        
        # Prepare messages
        messages = []
        if system_message:
            messages.append(SystemMessage(content=system_message))
        messages.append(HumanMessage(content=prompt))
        
        # Get response
        response = llm.invoke(messages)
        return response.content
        
    except Exception as e:
        return f"Error: {str(e)}"