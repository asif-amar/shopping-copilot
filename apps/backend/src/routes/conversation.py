import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from agno.agent import Agent
from agno.models.google import Gemini
from agno.storage.postgres import PostgresStorage
from typing import Dict, List, Optional, Any
from fastapi.responses import StreamingResponse
import json
import re
import uuid
from datetime import datetime
from agno.tools.newspaper4k import Newspaper4kTools
from agno.tools.googlesearch import GoogleSearchTools

from ..config import config
from ..tools.shopping_tools import ShoppingTools
from ..tools.shopping.constants import get_supported_sites
from ..auth import get_current_active_user, UserResponse
from ..services.credit_service import CreditService, InsufficientCreditsError
from ..database import get_db_dependency
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter(tags=["conversation"])

class MessageModel(BaseModel):
    id: str
    content: str
    role: str  # user or assistant
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    type: Optional[str] = None  # Add type field for streaming compatibility

class ConversationModel(BaseModel):
    id: str
    title: Optional[str] = None
    hostname: Optional[str] = None
    messages: List[MessageModel] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
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
            "CRITICAL: Never expose dev related things to the user. For example necer ask the user for a product_id, or any other dev related things.",
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
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
):
    """Send a message to a conversation (creates new conversation if needed)"""
    try:
        logger.info(f"Processing message for user: {current_user.email}")

        # Check if user has enough credits before processing
        try:
            if not CreditService.check_credit_availability(db, current_user.id, 1):
                credit_status = CreditService.get_user_credit_status(db, current_user.id)
                raise HTTPException(
                    status_code=402,  # Payment Required
                    detail={
                        "error": "insufficient_credits",
                        "message": "You don't have enough credits to send this message.",
                        "credits_remaining": credit_status["credits_remaining"],
                        "credits_exhausted": True
                    }
                )
        except InsufficientCreditsError as e:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "insufficient_credits", 
                    "message": str(e),
                    "credits_remaining": e.available,
                    "credits_exhausted": True
                }
            )

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
        
        # Track if we should deduct credit (will be set after successful response)
        should_deduct_credit = False
        full_response_content = ""
        
        async def generate_stream():
            nonlocal should_deduct_credit, full_response_content
            
            try:
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
                        # Capture response content for credit decision
                        full_response_content += event.content
                        # Stream content as-is without parsing
                        yield f"data: {json.dumps({'type': 'response', 'content': event.content})}\n\n"
                
                # Mark successful response for credit deduction
                should_deduct_credit = True
                
                # Handle credit deduction for successful responses
                try:
                    # Check if this response should be refunded (error/refresh indicators)
                    if CreditService.should_refund_for_response(full_response_content):
                        logger.info(f"Response contains error indicators, not deducting credit for user {current_user.email}")
                        should_deduct_credit = False
                    else:
                        # Deduct credit for successful conversation
                        CreditService.deduct_credit(
                            db=db,
                            user_id=current_user.id,
                            reason="conversation",
                            conversation_id=conversation_id,
                            description=f"Message: {request.message[:100]}..."
                        )
                        logger.info(f"Deducted 1 credit for user {current_user.email} - conversation {conversation_id}")
                        
                except Exception as credit_error:
                    logger.error(f"Error handling credit deduction: {credit_error}")
                    # Continue anyway - don't fail the response due to credit issues
                
                # Send completion event with updated credit info
                credit_status = CreditService.get_user_credit_status(db, current_user.id)
                completion_data = {
                    'type': 'complete', 
                    'conversation_id': conversation_id,
                    'credits_remaining': credit_status['credits_remaining'],
                    'is_low_credits': credit_status['is_low_credits'],
                    'credits_exhausted': credit_status['credits_exhausted']
                }
                yield f"data: {json.dumps(completion_data)}\n\n"
                
            except Exception as stream_error:
                logger.error(f"Error in stream generation: {stream_error}")
                # Don't deduct credit on stream errors
                should_deduct_credit = False
                yield f"data: {json.dumps({'type': 'error', 'message': 'An error occurred while processing your request.'})}\n\n"
        
        # Create the streaming response
        response = StreamingResponse(generate_stream(), media_type="text/event-stream")
        
        # Handle credit deduction after streaming is complete
        # Note: This is a bit tricky with streaming responses, so we'll handle it in the stream
        # The actual credit deduction happens in the generate_stream function
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions (like insufficient credits)
        raise
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
        
        # Read the agent session directly from storage
        agent_session = storage.read(session_id=conversation_id, user_id=str(current_user.id))
        
        if not agent_session:
            raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found")

        # Extract and format messages from agent session
        result = []
        
        if agent_session.memory and 'runs' in agent_session.memory:
            runs = agent_session.memory['runs']
            
            # Only process the last run since it contains the complete conversation
            if runs:
                last_run = runs[-1]
                messages = last_run.get('messages', [])
                print("PROCESSING LAST RUN\n", len(messages), "messages\n")
                buffer = None
                
                for message in messages:
                    role = message.get('role', '')
                    content = message.get('content', '')
                    timestamp = message.get('created_at', datetime.now().timestamp())
                    
                    if role == 'user':
                        # Finalize any ongoing assistant message first
                        if buffer:
                            result.append(buffer)
                            buffer = None
                        
                        # Add user message
                        result.append({
                            "id": f"user_{len(result)}_{int(timestamp)}",
                            "sender": "human", 
                            "content": content,
                            "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                        })
                    
                    elif role == 'assistant':
                        # If this is the first assistant message or we don't have a current one
                        if not buffer:
                            buffer = {
                                "id": f"assistant_{len(result)}_{int(timestamp)}",
                                "sender": "assistant",
                                "content": [],
                                "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                            }
                        
                        
                        # Process content to extract products while preserving order
                        if content:
                            # Split content by product tags to preserve order
                            parts = re.split(r'(<product>.*?</product>)', content, flags=re.DOTALL)
                            
                            for part in parts:
                                part = part.strip()
                                if not part:
                                    continue
                                    
                                if part.startswith('<product>') and part.endswith('</product>'):
                                    # Extract product JSON
                                    product_json = part[9:-10]  # Remove <product> and </product>
                                    try:
                                        # Handle escaped quotes that might be double-escaped
                                        cleaned_json = product_json.replace('\\"', '"').replace('\\\'', '\'')
                                        product_data = json.loads(cleaned_json)
                                        buffer["content"].append({
                                            "type": "product",
                                            "product": product_data,
                                            "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                                        })
                                    except json.JSONDecodeError as e:
                                        # If JSON parsing still fails, try with original string
                                        try:
                                            product_data = json.loads(product_json)
                                            buffer["content"].append({
                                                "type": "product",
                                                "product": product_data,
                                                "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                                            })
                                        except json.JSONDecodeError:
                                            # If both attempts fail, treat as text
                                            print(f"PRODUCT JSON ERROR: {e}")
                                            print(f"Original JSON: {product_json}")
                                            print(f"Cleaned JSON: {cleaned_json}")

                                else:
                                    # Regular text content
                                    buffer["content"].append({
                                        "type": "text",
                                        "text": part,
                                        "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                                    })
                    elif role == 'tool':
                        # Example: {'role': 'tool', 'content': ['**Added to Cart**\n**Website:** RAMI-LEVY\n**Product:** Product 3025\n**Quantity:** 5\n**Cart Item ID:** cart_3025'], 'metrics': {'time': 0.5974259579998034}, 'created_at': 1757405688, 'tool_calls': [{'content': '**Added to Cart**\n**Website:** RAMI-LEVY\n**Product:** Product 3025\n**Quantity:** 5\n**Cart Item ID:** cart_3025', 'tool_name': 'add_to_cart'}], 'from_history': False, 'stop_after_tool_call': False}
                        tool_calls = message.get('tool_calls', [])
                        if tool_calls:
                            for tool_call in tool_calls:
                                buffer["content"].append({
                                    "type": "tool",
                                    "tool": tool_call.get('tool_name', 'unknown_tool'),
                                    "arguments": tool_call.get('content', 'unknown_content'),
                                    "timestamp": datetime.fromtimestamp(timestamp).isoformat()
                                })

                    else:
                        continue
                
                # Finalize any remaining assistant message
                if buffer:
                    result.append(buffer)

        return {
            "conversation_id": conversation_id,
            "messages": result,
            "total_messages": len(result)
        }

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
                            updated_at,
                            memory,
                            extra_data
                        FROM ai.conversations 
                        WHERE user_id = %s
                        ORDER BY updated_at DESC
                        LIMIT %s
                    """, (str(current_user.id), limit))
                    
                    rows = cur.fetchall()

                    for row in rows:
                        session_id, agent_data, created_at, updated_at, memory, extra_data = row
                        
                        # Extract hostname from session data
                        hostname = "Unknown"
                        if agent_data and 'session_data' in agent_data:
                            hostname = agent_data['session_data'].get('hostname', 'Unknown')
                        
                        # Check if title already exists in extra_data
                        title = None
                        if extra_data and isinstance(extra_data, dict):
                            title = extra_data.get('title')
                        
                        # Generate title from first user message if not exists
                        if not title:
                            # Extract title from memory -> runs -> first run -> first user message
                            if memory:
                                runs = memory.get('runs', [])
                                if runs and len(runs) > 0:
                                    # Get the first run
                                    first_run = runs[0]
                                    messages = first_run.get('messages', [])
                                    
                                    # Find the first user message
                                    for msg in messages:
                                        if msg.get('role') == 'user' and msg.get('content'):
                                            content = msg['content'].strip()
                                            if content:
                                                # Use first 40 chars as title
                                                title = content[:40] + ("..." if len(content) > 40 else "")
                                                break
                            
                            # Store the generated title in extra_data
                            if title:
                                try:
                                    # Initialize extra_data as empty dict if None
                                    updated_extra_data = extra_data or {}
                                    updated_extra_data['title'] = title
                                    
                                    # Update the database with the new title
                                    cur.execute("""
                                        UPDATE ai.conversations 
                                        SET extra_data = %s 
                                        WHERE session_id = %s AND user_id = %s
                                    """, (json.dumps(updated_extra_data), session_id, str(current_user.id)))
                                    
                                    logger.info(f"Generated and stored title for conversation {session_id}: {title}")
                                except Exception as e:
                                    logger.error(f"Failed to store title for conversation {session_id}: {e}")
                        
                        # Fallback title if still None
                        if not title:
                            title = f"Conversation on {hostname}"
                        
                        # Extract messages for metadata (message count)
                        messages = []
                        if agent_data and 'memory' in agent_data and 'runs' in agent_data['memory']:
                            runs = agent_data['memory']['runs']
                            # Get messages from the latest run for count
                            if runs and len(runs) > 0:
                                latest_run = runs[-1]  # Last run has the most complete message list
                                messages = latest_run.get('messages', [])
                        
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
