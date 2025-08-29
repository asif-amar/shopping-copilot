import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.conversation import router as conversation_router

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Shopping Copilot API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Chrome extension origins (runtime generated IDs) - this is what actually sends requests
        "chrome-extension://*",
        # Development servers 
        "http://localhost:8787",  # MCP server
        "http://localhost:3001",  # Frontend dev server  
        "http://127.0.0.1:8000",  # This Python backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(conversation_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["src"],
        reload_excludes=["**/venv/**", "**/site-packages/**", "*.pyc", "**/__pycache__/**", ".git/**"]
    )