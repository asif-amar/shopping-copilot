import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from agno.agent import Agent
from agno.models.google import Gemini
from agno.storage.postgres import PostgresStorage
from typing import Dict, List, Optional, Any
from fastapi.responses import StreamingResponse
import json
import uuid
from datetime import datetime
from agno.tools.newspaper4k import Newspaper4kTools
from agno.tools.googlesearch import GoogleSearchTools

from ..config import config
from ..tools.shopping_tools import ShoppingTools
from ..tools.shopping.constants import get_supported_sites
from ..auth import get_current_active_user, UserResponse

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

class UserPreferences(BaseModel):
    aiStyle: Optional[str] = "balanced"
    # Future preferences can be added here
    
class SendMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    hostname: Optional[str] = None
    preferences: Optional[UserPreferences] = None

class ConversationResponse(BaseModel):
    conversation: ConversationModel
    status: str = "success"

def create_basic_agent(request_headers: Dict[str, str], preferences: Optional[UserPreferences] = None) -> Agent:
    """Create a basic Agno agent with Gemini model"""
    
    model = Gemini(id=config.GEMINI_MODEL, api_key=config.GEMINI_API_KEY)
    
    # Define AI style behaviors
    style_instructions = {
        "flexible": "Be very flexible and creative. Be proactive and autonomous. You can make autonomous decisions and suggestions that go beyond the exact user request. Example, if the user ask for 'תוסיף חלב לעגלה', you don't have to list the products that you found, but just add the best fit product to the cart.",
        "balanced": "Be helpful and efficient while staying focused on the user's specific request. Provide relevant suggestions and take reasonable initiative, but ask for clarification when needed.",
        "strict": "Be precise and focused strictly on the user's exact request. Only perform the specific actions requested without making additional suggestions or taking extra assumptions unless explicitly asked. If the request is ambiguous or general (e.g., 'תוסיף חלב לעגלה'), always show the user product results first and ask for clarification."
    }

    # Set default style and get style instruction
    current_style = preferences.aiStyle if preferences else "balanced"
    style_instruction = style_instructions.get(current_style, style_instructions["balanced"])
    
    storage = PostgresStorage(
        table_name="conversations",
        db_url=config.DATABASE_URL,
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
            "CRITICAL: Whenever the user asks to search, show, or add specific products, you must ALWAYS use the search_products tool to fetch real product data. Never invent, summarize, or output products without using the tool first, since product availability and details may change.",
            "CRITICAL: When tool responses include images (markdown format like ![alt](url) or HTML img tags), ALWAYS preserve them exactly in your response. Do not summarize or rewrite responses that contain images - show them as-is.",
            "When displaying product search results, always include the original formatted output from the search tool, including any images, links, and formatting.",
            f"BEHAVIOR STYLE: {style_instruction}",
            """
            ## SEARCH_PRODUCTS Tool Instructions
            ### Search Strategy:
            1. **Language**: Always search in Hebrew for Israeli websites (e.g., "milk" → "חלב", "bread" → "לחם")
            2. **Singular/Plural**: Start with singular form (e.g., if asked for "מסטיקים" search for "מסטיק"), then try plural if no results where found
            3. **Alternative terms**: Try different Hebrew terms if initial search fails (e.g., "חלב" → "חלב טרי" → "מוצרי חלב")
            4. **Multiple products**: For multiple items, search each separately to get comprehensive results
            5. **No unrelated products**: Never show unrelated products in the search results. If user asks for ״שעועית״, and the search tool returns products like ״קישוא״ - do not show it.

            ### Response Handling:
            The search_products tool returns array of products.
            Your response will include some/all of the products, each wrapped in individual `<product>{json}</product>` tags

            **CRITICAL RULES:**
            1. **PRODUCT CURATION**: You may remove products to improve user experience (default: show 3-4 products max unless specified)
            2. **NO REFORMATTING**: Never reformat, summarize, or recreate the product data within <product> tags
            3. **STREAMING SUPPORT**: Each <product> tag enables real-time frontend streaming - maintain this structure
            4. **NO DUPLICATIONS**: NEVER include the same product more than once in a single response, no duplications.

            ### Response Structure: 
            1. **Introduction**: Brief contextual message before results
            2. **TOOL OUTPUT**: The complete array of products, each wrapped in individual <product> tags
            3. **Follow-up**: Helpful suggestions or questions after results

            ### Examples:

            **Single Product Search:**
            User: "חפש חלב"
            Tool: [{"name":"חלב טרי 3%","price":"5.90","url":"..."}]
            Response: "מצאתי חלב באתר:\n<product>{"name":"חלב טרי 3%","price":"5.90","url":"..."}</product>\nהאם תרצה שאוסיף לעגלה?"

            **Multiple Products (curated):**
            User: "חפש חלב, לחם וגבינה"
            Tool returns: 15 products total
            Response: Show 2-3 best products from each category + "רוצה לראות עוד מוצרים?" or "האם תרצה שאוסיף לעגלה?"

            **No Results:**
            If search fails, suggest alternative terms or products.
            """,
            """
            ## Cart Operations Tool Instructions:
            All of the cart operation tools has a built in get_cart_contents tool call.
            You need to use the get_cart_contents yourself if you want to get the cart contents with the product_ids.
            """
        ],
        markdown=True,
        storage=storage,
        session_state={"preferences": preferences.dict() if preferences else {"aiStyle": "balanced"}},
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_runs=5, # TODO: Find the magic number for us...
        show_tool_calls=False,
    )
    return agent

@router.post("/conversation")
async def send_message(
    request: SendMessageRequest, 
    http_request: Request,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Send a message to a conversation (creates new conversation if needed)"""
    try:
        logger.info(f"Processing message for user: {current_user.email}")

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
        agent = create_basic_agent(request_headers, request.preferences)
        
        async def generate_stream():
            # First, send conversation info to frontend
            yield f"data: {json.dumps({'type': 'conversation_info', 'conversation_id': conversation_id, 'hostname': request.hostname})}\n\n"
            
            # Stream response with intermediate steps
            response_stream = await agent.arun(
                request.message, 
                user_id=str(current_user.id), 
                session_id=conversation_id,
                stream=True,
                stream_intermediate_steps=True
            )
            
            async for event in response_stream:
                # Stream tool call events
                if event.event == "ToolCallStarted":
                    print(f"\nEvent tool: {event.tool}\n")
                    yield f"data: {json.dumps({'type': 'tool', 'content': f'{event.tool.tool_name}_started'})}\n\n"
                elif event.event == "ToolCallCompleted":
                    print(f"\nTool call completed: {event.tool.tool_name}\n")
                    yield f"data: {json.dumps({'type': 'tool', 'content': f'{event.tool.tool_name}_completed'})}\n\n"
                elif event.event == "ReasoningStep":
                    print(f"\nReasoning step: {event.content}\n")
                    yield f"data: {json.dumps({'type': 'thinking', 'content': f'💭 {event.content}'})}\n\n"
                elif event.event == "RunResponseContent":
                    # print(f"\nRun response content: {event.content}\n")
                    print(event.content)
                    # Stream content as-is without parsing
                    yield f"data: {json.dumps({'type': 'response', 'content': event.content})}\n\n"
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'complete', 'conversation_id': conversation_id})}\n\n"
        
        return StreamingResponse(generate_stream(), media_type="text/event-stream")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.get("/conversation/{conversation_id}")
async def get_conversation(
    conversation_id: str, 
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific conversation with all its messages"""
    try:
        logger.info(f"Retrieving conversation: {conversation_id} for user: {current_user.email}")

        # Initialize PostgreSQL storage
        storage = PostgresStorage(
            table_name="conversations", 
            db_url=config.DATABASE_URL
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

@router.get("/conversations")
async def list_conversations(
    current_user: UserResponse = Depends(get_current_active_user),
    limit: int = 50
):
    """List all conversations for the authenticated user"""
    try:
        logger.info(f"Listing conversations for user: {current_user.email} (limit: {limit})")
        
        # Initialize PostgreSQL storage
        storage = PostgresStorage(
            table_name="conversations", 
            db_url=config.DATABASE_URL
        )
        
        # Get recent conversations for the user
        # This queries the Agno storage for sessions belonging to the user
        try:
            # Get conversations from the database
            # The storage.get_all_sessions() method gets all sessions, 
            # but we need to filter by user_id
            import psycopg
            
            conversations = []
            
            # Connect to the database directly to query user sessions
            with psycopg.connect(config.DATABASE_URL) as conn:
                with conn.cursor() as cur:
                    # Query for sessions belonging to this user
                    cur.execute("""
                        SELECT 
                            session_id,
                            agent_data,
                            created_at,
                            updated_at
                        FROM ai.conversations 
                        WHERE agent_data->>'user_id' = %s
                        ORDER BY updated_at DESC
                        LIMIT %s
                    """, (str(current_user.id), limit))
                    
                    rows = cur.fetchall()
                    
                    for row in rows:
                        session_id, agent_data, created_at, updated_at = row
                        
                        # Extract messages from agent_data
                        messages = []
                        if agent_data and 'messages' in agent_data:
                            messages = agent_data['messages']
                        
                        # Extract hostname from session data
                        hostname = "Unknown"
                        if agent_data and 'session_data' in agent_data:
                            hostname = agent_data['session_data'].get('hostname', 'Unknown')
                        
                        # Generate a title from the first user message
                        title = f"Conversation on {hostname}"
                        if messages:
                            for msg in messages:
                                if msg.get('role') == 'user' and msg.get('content'):
                                    # Use first 50 chars of first user message as title
                                    title = msg['content'][:50] + ("..." if len(msg['content']) > 50 else "")
                                    break
                        
                        conversation_item = ConversationModel(
                            id=session_id,
                            title=title,
                            hostname=hostname,
                            messages=[],  # We'll populate this when specifically requested
                            created_at=created_at,
                            updated_at=updated_at,
                            metadata={'message_count': len(messages)}
                        )
                        conversations.append(conversation_item)
            
            return {
                "conversations": [conv.dict() for conv in conversations], 
                "total": len(conversations), 
                "user": current_user.email
            }
            
        except Exception as db_error:
            logger.warning(f"Database query failed: {db_error}, returning empty list")
            return {"conversations": [], "total": 0, "user": current_user.email}
        
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list conversations: {str(e)}")
