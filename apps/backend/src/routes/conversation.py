import logging
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from agno.agent import Agent
from agno.models.google import Gemini
from dotenv import load_dotenv
from agno.storage.postgres import PostgresStorage
from typing import Dict, List, Optional, Any
from fastapi.responses import StreamingResponse
import json
import uuid
from datetime import datetime
from agno.tools.newspaper4k import Newspaper4kTools
from agno.tools.googlesearch import GoogleSearchTools

from ..tools.shopping_tools import ShoppingTools
from ..tools.shopping.constants import get_supported_sites
from ..services.product_stream_parser import ProductStreamParser

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(tags=["conversation"])

class MessageModel(BaseModel):
    id: str
    content: str
    role: str  # user or assistant
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class ConversationModel(BaseModel):
    id: str
    title: Optional[str] = None
    hostname: Optional[str] = None
    messages: List[MessageModel] = []
    created_at: datetime
    updated_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class SendMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    user_id: str = "default_user"
    hostname: Optional[str] = None

class ConversationResponse(BaseModel):
    conversation: ConversationModel
    status: str = "success"

def create_basic_agent(request_headers: Dict[str, str]) -> Agent:
    """Create a basic Agno agent with Gemini model"""
    
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gemini_model = os.getenv("GEMINI_MODEL")
    model = Gemini(id=gemini_model, api_key=gemini_api_key)
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    storage = PostgresStorage(
        table_name="conversations",
        db_url=db_url,
        auto_upgrade_schema=True
    )

    shopping_tools = ShoppingTools(request_headers)
    websearch_tools = GoogleSearchTools()
    scraping_tools = Newspaper4kTools()
    website_name = request_headers.get("x-site-name")

    agent = Agent(
        name="Shopping Copilot",
        agent_id="shopping-copilot",
        model=model,
        tools=[shopping_tools, websearch_tools, scraping_tools],
        instructions=[
            "You are a shopping assistant that can help users search for products and manage their shopping carts on Israeli e-commerce websites.",
            f"You can search for products on the following websites: {', '.join([site.value for site in get_supported_sites()])}.",
            f"You are currently operating on the {website_name} website. All requests should be related to this website, unless specified otherwise.",
            "Always search in Hebrew for Israeli websites (e.g., milk -> חלב). You are a male persona.",
            "When helping with shopping, use the available tools to search products, add items to cart, and manage cart contents.",
            "Be helpful and provide detailed product information including prices, availability, and descriptions.",
            "If credentials are missing or invalid, inform the user to try and refresh the page. Never reveal credentials to the user.",
            "Always return your results in Hebrew, unless the user asks you in English.",
            "Always try using your tools, even if you failed before!",
            "Return the URL for the product for a quick lookup exactly as you get it from the search tool.",
            "If the user ask for, you can also search the web for recipes and suggest ingredients from {website_name}.",
            "When searching for information, first use GoogleSearchTools to find relevant URLs",
            "Then use the newspaper tools to read and extract the actual content from those URLs",
            "Provide comprehensive information based on the scraped content, not just URLs",
            "IMPORTANT: Never expose inside errors to the user!",
            "CRITICAL: When tool responses include images (markdown format like ![alt](url) or HTML img tags), ALWAYS preserve them exactly in your response. Do not summarize or rewrite responses that contain images - show them as-is.",
            "When displaying product search results, always include the original formatted output from the search tool, including any images, links, and formatting.",
            "You can take initiative and perform actions on behalf of the user when the intent is clear, without asking for unnecessary confirmations.",
            "For example, if the user asks to show milk products and then says \"add one of these to the cart,\" you should autonomously choose the most relevant or best option and add it.",
            """
            ## SEARCH_PRODUCTS Tool Instructions
            ### Search Strategy:
            1. **Language**: Always search in Hebrew for Israeli websites (e.g., "milk" → "חלב", "bread" → "לחם")
            2. **Singular/Plural**: Start with singular form (e.g., if asked for "מסטיקים" search for "מסטיק"), then try plural if no results where found
            3. **Alternative terms**: Try different Hebrew terms if initial search fails (e.g., "חלב" → "חלב טרי" → "מוצרי חלב")
            4. **Multiple products**: For multiple items, search each separately to get comprehensive results

            ### Response Handling:
            The search_products tool returns array of products.
            Your response will include some/all of the products, wrapped in `<product_search_results><product>{json}</product><product>{json}</product>...</product_search_results>`

            **CRITICAL RULES:**
            1. **PRODUCT CURATION**: You may remove products to improve user experience (default: show 3-4 products max unless specified)
            2. **NO REFORMATTING**: Never reformat, summarize, or recreate the product data within <product> tags
            3. **STREAMING SUPPORT**: Each <product> tag enables real-time frontend streaming - maintain this structure
            4. **NO DUPLICATIONS**: NEVER include the same product more than once in a single response, no duplications.

            ### Response Structure: 
            1. **Introduction**: Brief contextual message before results
            2. **TOOL OUTPUT**: The complete array of products, wrapped in <product_search_results> tag
            3. **Follow-up**: Helpful suggestions or questions after results

            ### Examples:

            **Single Product Search:**
            User: "חפש חלב"
            Tool: [{"name":"חלב טרי 3%","price":"5.90","url":"..."}]
            Response: "מצאתי חלב באתר:\n<product_search_results><product>{"name":"חלב טרי 3%","price":"5.90","url":"..."}</product></product_search_results>\nהאם תרצה שאוסיף לעגלה?"

            **Multiple Products (curated):**
            User: "חפש חלב, לחם וגבינה"
            Tool returns: 15 products total
            Response: Show 2-3 best products from each category + "רוצה לראות עוד מוצרים?" or "האם תרצה שאוסיף לעגלה?"

            **No Results:**
            If search fails, suggest alternative terms or products.
            """,
        ],
        markdown=True,
        storage=storage,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_runs=5, # TODO: Find the magic number for us...
        show_tool_calls=True,
    )
    return agent

@router.post("/conversation")
async def send_message(request: SendMessageRequest, http_request: Request):
    """Send a message to a conversation (creates new conversation if needed)"""
    try:
        logger.info(f"Processing message for user: {request.user_id}")

        # Extract headers for credential management
        request_headers = dict(http_request.headers)
        logger.info(f"Request headers available: {list(request_headers.keys())}")
        
        # Generate conversation ID if not provided
        if request.conversation_id:
            conversation_id = request.conversation_id
        else:
            # Create new conversation uuid that is a string
            conversation_id = str(uuid.uuid4())
        
        # Create the agent
        agent = create_basic_agent(request_headers)
        
        async def generate_stream():
            # Initialize product parser for this conversation
            product_parser = ProductStreamParser()
            
            # First, send conversation info to frontend
            yield f"data: {json.dumps({'type': 'conversation_info', 'conversation_id': conversation_id, 'hostname': request.hostname})}\n\n"
            
            # Stream response with intermediate steps
            response_stream = await agent.arun(
                request.message, 
                user_id=request.user_id, 
                session_id=conversation_id,
                stream=True,
                stream_intermediate_steps=True
            )
            
            async for event in response_stream:
                # Stream thinking process events
                if event.event == "ToolCallStarted":
                    print(f"\nEvent tool: {event.tool}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'{event.tool.tool_name}_started'})}\n\n"
                elif event.event == "ToolCallCompleted":
                    print(f"\nTool call completed: {event.tool.tool_name}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'{event.tool.tool_name}_completed'})}\n\n"
                elif event.event == "ReasoningStep":
                    print(f"\nReasoning step: {event.content}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'💭 {event.content}'})}\n\n"
                elif event.event == "RunResponseContent":
                    print(f"\nRun response content: {event.content}\n")
                    
                    # Debug: Check if content contains expected product tags
                    if "<product_search_results>" in event.content:
                        print("🔍 Found product_search_results opening tag!")
                    if "</product_search_results>" in event.content:
                        print("🔍 Found product_search_results closing tag!")
                    
                    # Parse content for products
                    parse_results = product_parser.parse_chunk(event.content)
                    
                    # Stream each parsed result
                    for result in parse_results:
                        if result['type'] == 'text':
                            yield f"data: {json.dumps({'type': 'response', 'content': result['content']})}\n\n"
                        elif result['type'] == 'product_start':
                            print("🚀 Product section started")
                            yield f"data: {json.dumps({'type': 'product_start'})}\n\n"
                        elif result['type'] == 'product':
                            print(f"📦 Streaming product: {result['product'].get('name', 'Unknown')}")
                            yield f"data: {json.dumps({'type': 'product', 'product': result['product']})}\n\n"
                        elif result['type'] == 'product_end':
                            print("🏁 Product section ended")
                            yield f"data: {json.dumps({'type': 'product_end'})}\n\n"
            
            # Flush any remaining content from parser
            remaining_results = product_parser.flush()
            for result in remaining_results:
                if result['type'] == 'text':
                    yield f"data: {json.dumps({'type': 'response', 'content': result['content']})}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete', 'conversation_id': conversation_id})}\n\n"
        
        return StreamingResponse(generate_stream(), media_type="text/event-stream")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, user_id: str = "default_user"):
    """Get a specific conversation with all its messages"""
    try:
        logger.info(f"Retrieving conversation: {conversation_id} for user: {user_id}")

        # Initialize PostgreSQL storage
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise ValueError("DATABASE_URL environment variable is required")
            
        storage = PostgresStorage(
            table_name="conversations", 
            db_url=db_url
        )
        
        # Create a temporary agent with the storage to access the session
        agent = Agent(storage=storage, session_id=conversation_id)

        # Get messages for the session
        messages = agent.get_messages_for_session()

        # parsed_messages = [
        #     {
        #         "role": message.role,
        #         "content": message.content,
        #         "timestamp": getattr(message, 'timestamp', None)
        #     }
        #     for message in messages
        # ]

        conversation = ConversationModel(
            id=conversation_id,
            title="Conversation",
            hostname="",
            messages=messages,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={}
        )

        return ConversationResponse(conversation=conversation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversation: {str(e)}")
