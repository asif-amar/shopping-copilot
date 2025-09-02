"""Authentication utilities and dependencies for FastAPI."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import uuid4

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db_dependency
from .services.user_service import UserService
from .config import config

logger = logging.getLogger(__name__)

# JWT Configuration from environment
JWT_SECRET_KEY = config.JWT_SECRET_KEY or "fallback-dev-secret-key"  
ALGORITHM = config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = config.JWT_EXPIRE_MINUTES

# Security scheme
security = HTTPBearer()


class TokenData(BaseModel):
    """Token payload data model."""
    email: Optional[str] = None
    sub: Optional[str] = None
    jti: Optional[str] = None  # JWT ID
    user_id: Optional[str] = None


class UserResponse(BaseModel):
    """User response model."""
    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool = True


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with JTI."""
    to_encode = data.copy()
    
    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add standard claims
    jti = str(uuid4())  # Unique token ID
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": jti
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, db: Session) -> TokenData:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract claims
        email: str = payload.get("sub")
        jti: str = payload.get("jti")
        user_id: str = payload.get("user_id")
        
        if email is None or jti is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if token is blacklisted
        if UserService.is_token_blacklisted(db, jti):
            logger.warning(f"Attempt to use blacklisted token: {jti[:20]}...")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token_data = TokenData(
            email=email, 
            sub=email, 
            jti=jti, 
            user_id=user_id
        )
        return token_data
        
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_dependency)
) -> UserResponse:
    """Get current authenticated user from JWT token."""
    token_data = verify_token(credentials.credentials, db)
    
    # Get user from database
    from .database import User as DBUser
    db_user = db.query(DBUser).filter(DBUser.email == token_data.email).first()
    
    if not db_user or not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.full_name,
        is_active=db_user.is_active
    )


def get_current_active_user(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_token_data(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_dependency)
) -> TokenData:
    """Get token data without user lookup (useful for logout)."""
    return verify_token(credentials.credentials, db)


def get_request_info(request: Request) -> dict:
    """Extract request information for session tracking."""
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent")
    }