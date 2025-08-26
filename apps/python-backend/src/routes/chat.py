import logging
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv
from agno.storage.postgres import PostgresStorage
from typing import Dict
from fastapi.responses import StreamingResponse
import json
# Import shopping tools and constants
from ..tools.shopping_tools import ShoppingTools
from ..tools.shopping.constants import get_supported_sites

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

# Credentials are now handled via headers only - no body credentials needed

class ChatRequest(BaseModel):
    message: str
    user_id: str = "default_user"

class ChatResponse(BaseModel):
    response: str
    status: str

def create_basic_agent(request_headers: Dict[str, str]) -> Agent:
    """Create a basic Agno agent with Gemini model"""
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL")
    model = Gemini(id=gemini_model, api_key=gemini_api_key)
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    storage = PostgresStorage(
        table_name="agent_sessions",
        db_url=db_url,
        auto_upgrade_schema=True
    )

    tools = ShoppingTools(request_headers)
    website_name = request_headers.get("x-site-name")

    agent = Agent(
        name="Shopping Copilot",
        agent_id="shopping-copilot",
        model=model,
        tools=[tools],
        # TODO: The prompt must be enhanced. For example if one search went wrong because of bad credentials, the followup search might not even occur.
        instructions=[
            "You are a shopping assistant that can help users search for products and manage their shopping carts on Israeli e-commerce websites.",
            f"You can search for products on the following websites: {', '.join([site.value for site in get_supported_sites()])}.",
            f"You are currently operating on the {website_name} website. All requests should be related to this website, unless specified otherwise.",
            "Always search in Hebrew for Israeli websites (e.g., milk -> חלב).",
            "When helping with shopping, use the available tools to search products, add items to cart, and manage cart contents.",
            "Be helpful and provide detailed product information including prices, availability, and descriptions.",
            "If credentials are missing or invalid, inform the user to try and refresh the page. Never reveal credentials to the user.",
            "If one website search fails due to credentials, suggest searching other available websites.",
            "Always return your results in Hebrew."
            "Return the URL for the product for a quick lookup exactly as you get it from the search tool."
            """
            <example_product_response>
            **חלב טרי 3%** - מחיר: 7.2 ש״ח, זמין במלאי. קישור: https://www.rami-levy.co.il/he/online/search?item=7290001794852
            </example_product_response>
            """
        ],
        markdown=True,
        storage=storage,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_runs=3, # TODO: Find the magic number for us...
        show_tool_calls=True,
    )
    return agent

@router.post("/chat/complete")
async def chat_complete():
    logger.info("Chat complete endpoint accessed")
    return {"message": "Chat complete endpoint is working", "status": "success"}

@router.post("/chat/agent", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest, http_request: Request):
    """Chat with Agno agent endpoint"""
    try:
        logger.info(f"Agent chat endpoint accessed for user: {request.user_id}")
        logger.info(f"Processing request with dynamic credentials")
        
        # Extract headers for credential management
        request_headers = dict(http_request.headers)
        logger.info(f"Request headers available: {list(request_headers.keys())}")
        
        # Create the agent without credentials
        agent = create_basic_agent(request_headers)

        # Get response from agent
        # response = await agent.arun(request.message, user_id="2", session_id="your_session_id")
        
        # logger.info(f"Agent response generated for user: {request.user_id}")
        
        # return ChatResponse(
        #     response=response.content,
        #     status="success"
        # )

        # Streaming example for later (NOT FOR NOW):
        async def generate_stream():
            # Stream response with intermediate steps
            response_stream = await agent.arun(
                request.message, 
                user_id=request.user_id, 
                session_id="your_session_id",
                stream=True,
                stream_intermediate_steps=True
            )
            
            async for event in response_stream:
                # Stream thinking process events
                if event.event == "ToolCallStarted":
                    print(f"\nEvent tool: {event.tool}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'🔧 Searching {event.tool.tool_name}...'})}\n\n"
                elif event.event == "ToolCallCompleted":
                    print(f"\nTool call completed: {event.tool.tool_name}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'✅ Found results from {event.tool.tool_name}'})}\n\n"
                elif event.event == "ReasoningStep":
                    print(f"\nReasoning step: {event.content}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'💭 {event.content}'})}\n\n"
                elif event.event == "RunResponseContent":
                    print(f"\nRun response content: {event.content}\n")
                    yield f"data: {json.dumps({'type': 'response', 'content': event.content})}\n\n"
        
        return StreamingResponse(generate_stream(), media_type="text/event-stream")

        
    except ValueError as ve:
        logger.error(f"Configuration error: {ve}")
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        logger.error(f"Agent chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")