"""Authentication routes for Google OAuth integration."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import aiohttp
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, DisconnectionError

from ..config import config
from ..database import get_db_dependency
from ..auth import create_access_token, get_current_active_user, get_token_data, get_request_info, UserResponse, TokenData
from ..services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()

class GoogleTokenRequest(BaseModel):
    """Request model for Google token authentication."""
    token: str


class AuthResponse(BaseModel):
    """Response model for authentication."""
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/google", response_model=AuthResponse)
async def auth_with_google(
    token_data: GoogleTokenRequest,
    request: Request,
    db: Session = Depends(get_db_dependency)
) -> AuthResponse:
    """Authenticate user with Google OAuth token."""
    google_token = token_data.token
    
    try:
        # Verify the Google token by sending it to Google's tokeninfo endpoint
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={google_token}"
            ) as response:
                if response.status != 200:
                    logger.warning(f"Google token verification failed with status {response.status}")
                    raise HTTPException(status_code=400, detail="Invalid Google token")
                
                user_info = await response.json()
    
    except aiohttp.ClientError as e:
        logger.error(f"Failed to verify Google token: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify token with Google")
    
    # Check if the token has required fields
    user_email = user_info.get("email")
    if not user_email:
        logger.warning("No email found in Google token response")
        raise HTTPException(status_code=400, detail="No email found in token")
    
    # Get or create user in database with retry logic
    try:
        db_user = UserService.get_or_create_user(db, user_email, user_info)
    except (OperationalError, DisconnectionError) as e:
        logger.error(f"Database connection error during user creation: {e}")
        raise HTTPException(
            status_code=503, 
            detail="Database service temporarily unavailable. Please try again."
        )
    
    # Get request info for session tracking
    request_info = get_request_info(request)
    
    # Create JWT payload with user ID
    jwt_payload = {
        "sub": user_email,
        "email": user_email,
        "user_id": db_user.id
    }
    
    # Create access token with JTI
    our_jwt = create_access_token(data=jwt_payload)
    
    # Decode the token to get the JTI for session tracking
    from jose import jwt as jose_jwt
    token_payload = jose_jwt.decode(our_jwt, key="", options={"verify_signature": False})
    jti = token_payload["jti"]
    expires_at = datetime.fromtimestamp(token_payload["exp"], tz=timezone.utc)
    
    # Create session record
    UserService.create_user_session(
        db=db,
        user_id=db_user.id,
        user_email=db_user.email,
        token_jti=jti,
        expires_at=expires_at,
        ip_address=request_info["ip_address"],
        user_agent=request_info["user_agent"]
    )
    
    logger.info(f"User authenticated successfully: {user_email}")
    
    return AuthResponse(
        access_token=our_jwt,
        user={
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "is_active": db_user.is_active
        }
    )


@router.post("/logout")  # Logout endpoint
async def logout(
    current_user: UserResponse = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_token_data),
    db: Session = Depends(get_db_dependency)
) -> dict:
    """Logout user by blacklisting their JWT token."""
    try:
        # We need to decode the original token to get expiration
        # The token_data.jti is just the ID, not the full token
        # We'll use the current time + expected expiration as fallback
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=60*24*7)  # 1 week from now
        
        # Blacklist the token in database
        UserService.blacklist_token(
            db=db,
            token_jti=token_data.jti,
            user_id=current_user.id,
            user_email=current_user.email,
            expires_at=expires_at,
            reason="logout"
        )
        
        # End the user session
        UserService.end_user_session(
            db=db,
            token_jti=token_data.jti,
            reason="logout"
        )
        
        logger.info(f"User {current_user.email} logged out successfully")
        
        return {
            "message": "Successfully logged out",
            "user": current_user.email
        }
        
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")