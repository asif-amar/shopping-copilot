import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import config
from .routes.conversation import router as conversation_router
from .routes.auth import router as auth_router
from .routes.user import router as user_router
from .middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from .database import create_tables

load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Validate required environment variables
try:
    config.validate_required_env_vars()
    # Initialize database tables
    create_tables()
except ValueError as e:
    logger.error(f"Configuration error: {e}")
    raise

app = FastAPI(
    title="Shopping Copilot API",
    version="1.0.0",
    docs_url="/docs" if not config.is_production() else None,
    redoc_url="/redoc" if not config.is_production() else None
)

# Add custom middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(conversation_router, prefix="/api")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(user_router, prefix="/api/user")

# For Vercel deployment, the app instance is automatically detected
# For local development, use: uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=not config.is_production(),
        reload_dirs=["src"] if not config.is_production() else None,
        reload_excludes=["**/venv/**", "**/site-packages/**", "*.pyc", "**/__pycache__/**", ".git/**"] if not config.is_production() else None
    )