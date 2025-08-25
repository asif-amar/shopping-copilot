import logging
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv
from agno.storage.postgres import PostgresStorage
# from fastapi.responses import StreamingResponse
# import json

# Import shopping tools
from ..tools.shopping_tools import ShoppingTools

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

class ShoppingCredentials(BaseModel):
    # Rami Levy credentials
    rami_levy_api_key: Optional[str] = None
    rami_levy_ecom_token: Optional[str] = None
    rami_levy_cookie: Optional[str] = None
    rami_levy_user_id: Optional[str] = None
    
    # Shufersal credentials  
    shufersal_csrf_token: Optional[str] = None
    shufersal_cookie: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    user_id: str = "default_user"
    credentials: Optional[ShoppingCredentials] = None

class ChatResponse(BaseModel):
    response: str
    status: str

def create_basic_agent(credentials: Optional[ShoppingCredentials] = None) -> Agent:
    """Create a basic Agno agent with Gemini model"""
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL")
    model = Gemini(id=gemini_model, api_key=gemini_api_key)
    db_url = os.getenv("DATABASE_URL")

    storage = PostgresStorage(
        table_name="agent_sessions",
        db_url=db_url,
        auto_upgrade_schema=True
    )

    # TODO: Change that to be generic and not specific to Rami Levy and Shufersal
    rami_levy_creds = None
    shufersal_creds = None
    if credentials:
        if any([
            credentials.rami_levy_api_key,
            credentials.rami_levy_ecom_token, 
            credentials.rami_levy_cookie,
            credentials.rami_levy_user_id
        ]):
            rami_levy_creds = {
                "rami_levy_api_key": credentials.rami_levy_api_key,
                "rami_levy_ecom_token": credentials.rami_levy_ecom_token,
                "rami_levy_cookie": credentials.rami_levy_cookie,
                "rami_levy_user_id": credentials.rami_levy_user_id
            }
        
        if any([credentials.shufersal_csrf_token, credentials.shufersal_cookie]):
            shufersal_creds = {
                "shufersal_csrf_token": credentials.shufersal_csrf_token,
                "shufersal_cookie": credentials.shufersal_cookie
            }
    
    tools = ShoppingTools(
        rami_levy_credentials=rami_levy_creds,
        shufersal_credentials=shufersal_creds
    )

    agent = Agent(
        name="Shopping Copilot",
        agent_id="shopping-copilot",
        model=model,
        tools=[tools],
        # TODO: The prompt must be enhance. For example if one search went wrong because of bad credentials, the followup search might not even occur.
        instructions=[
            "You are a shopping assistant that can help users search for products and manage their shopping carts on Israeli e-commerce websites.",
            "You can search for products on Rami Levy (rami-levy) and Shufersal (shufersal) websites.",
            "Always search in Hebrew for Israeli websites (e.g., milk -> חלב).",
            "When helping with shopping, use the available tools to search products, add items to cart, and manage cart contents.",
            "Be helpful and provide detailed product information including prices, availability, and descriptions.",
            "If users need to provide credentials, explain that they need API keys and authentication tokens for the shopping websites.",
            "Always return your results in Hebrew."
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
async def chat_with_agent(request: ChatRequest):
    """Chat with Agno agent endpoint"""
    try:
        logger.info(f"Agent chat endpoint accessed for user: {request.user_id}")
        logger.info(f"Agent request.credentials: {request.credentials}")
        
        # Debug the raw request data
        if request.credentials:
            logger.info(f"Rami Levy API Key: {request.credentials.rami_levy_api_key}")
            logger.info(f"Rami Levy Token: {request.credentials.rami_levy_ecom_token}")
            logger.info(f"Shufersal Token: {request.credentials.shufersal_csrf_token}")
        else:
            logger.info("No credentials provided in request")

        # Create the agent with credentials from the request
        agent = create_basic_agent(request.credentials)
        
        # Get response from agent
        response = await agent.arun(request.message, user_id="2", session_id="your_session_id")
        
        logger.info(f"Agent response generated for user: {request.user_id}")
        
        return ChatResponse(
            response=response.content,
            status="success"
        )

        # Streaming example for later (NOT FOR NOW):
        # async def generate_stream():
        #     # Stream response with intermediate steps
        #     response_stream = await agent.arun(
        #         request.message, 
        #         user_id=request.user_id, 
        #         session_id="your_session_id",
        #         stream=True,
        #         stream_intermediate_steps=True
        #     )
            
        #     async for event in response_stream:
        #         # Stream thinking process events
        #         if event.event == "ToolCallStarted":
        #             print(f"\nEvent tool: {event.tool}\n")
        #             yield f"data: {json.dumps({'type': 'thinking', 'content': f'🔧 Searching {event.tool.tool_name}...'})}\n\n"
        #         elif event.event == "ToolCallCompleted":
        #             print(f"\nTool call completed: {event.tool.tool_name}\n")
        #             yield f"data: {json.dumps({'type': 'thinking', 'content': f'✅ Found results from {event.tool.tool_name}'})}\n\n"
        #         elif event.event == "ReasoningStep":
        #             print(f"\nReasoning step: {event.content}\n")
        #             yield f"data: {json.dumps({'type': 'thinking', 'content': f'💭 {event.content}'})}\n\n"
        #         elif event.event == "RunResponseContent":
        #             print(f"\nRun response content: {event.content}\n")
        #             yield f"data: {json.dumps({'type': 'response', 'content': event.content})}\n\n"
        
        # return StreamingResponse(generate_stream(), media_type="text/event-stream")

        
    except ValueError as ve:
        logger.error(f"Configuration error: {ve}")
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        logger.error(f"Agent chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")