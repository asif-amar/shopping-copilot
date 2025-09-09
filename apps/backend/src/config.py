"""Configuration management for the Shopping Copilot backend."""

import os
from typing import Optional
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class Config:
    """Application configuration class."""
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    
    # AI Model Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-pro")
    
    # JWT Configuration
    JWT_SECRET_KEY: Optional[str] = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 1 week
    
    # OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    
    # CORS Configuration
    FRONTEND_URL: Optional[str] = os.getenv("FRONTEND_URL")
    CORS_ORIGINS: Optional[str] = os.getenv("CORS_ORIGINS")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "WARNING")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    @classmethod
    def validate_required_env_vars(cls) -> None:
        """Validate that all required environment variables are set."""
        required_vars = {
            "DATABASE_URL": cls.DATABASE_URL,
            "GEMINI_API_KEY": cls.GEMINI_API_KEY,
            "JWT_SECRET_KEY": cls.JWT_SECRET_KEY,
        }
        
        missing_vars = []
        for var_name, var_value in required_vars.items():
            if not var_value:
                missing_vars.append(var_name)
        
        if missing_vars:
            error_msg = f"Missing required environment variables: {', '.join(missing_vars)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        logger.info("All required environment variables are configured")
    
    @classmethod
    def get_cors_origins(cls) -> list[str]:
        """Get CORS origins based on environment."""
        origins = ["chrome-extension://*"]  # Always allow Chrome extensions
        
        if cls.ENVIRONMENT == "production":
            if cls.FRONTEND_URL:
                origins.append(cls.FRONTEND_URL)
            if cls.CORS_ORIGINS:
                origins.extend(cls.CORS_ORIGINS.split(","))
        else:
            # Development origins
            origins.extend([
                "http://localhost:8787",  # MCP server
                "http://localhost:3001",  # Frontend dev server  
                "http://127.0.0.1:8000",  # This Python backend
                "http://localhost:5173",  # Vite dev server default
            ])
        
        return origins
    
    @classmethod
    def is_production(cls) -> bool:
        """Check if running in production environment."""
        return cls.ENVIRONMENT == "production"

# Initialize configuration on import
config = Config()