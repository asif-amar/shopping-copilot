"""User profile routes for managing user information."""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db_dependency
from ..auth import get_current_active_user, UserResponse
from ..services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()


class UserProfileUpdate(BaseModel):
    """Request model for updating user profile."""
    full_name: Optional[str] = Field(None, max_length=255, description="User's full name")
    profile_picture_url: Optional[str] = Field(None, max_length=512, description="Profile picture URL")
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) < 1:
                raise ValueError('Full name must be at least 1 character long')
        return v
    
    @validator('profile_picture_url')
    def validate_profile_picture_url(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            # Basic URL validation
            if not (v.startswith('http://') or v.startswith('https://')):
                raise ValueError('Profile picture URL must start with http:// or https://')
        return v


class UserProfileResponse(BaseModel):
    """Response model for user profile."""
    id: str
    email: str
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str
    last_login_at: Optional[str] = None


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> UserProfileResponse:
    """Get the current user's profile information."""
    try:
        # Get full user data from database
        from ..database import User as DBUser
        db_user = db.query(DBUser).filter(DBUser.id == current_user.id).first()
        
        if not db_user:
            logger.error(f"User not found in database: {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserProfileResponse(
            id=db_user.id,
            email=db_user.email,
            full_name=db_user.full_name,
            profile_picture_url=db_user.profile_picture_url,
            is_active=db_user.is_active,
            created_at=db_user.created_at.isoformat(),
            updated_at=db_user.updated_at.isoformat(),
            last_login_at=db_user.last_login_at.isoformat() if db_user.last_login_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )


@router.put("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    profile_update: UserProfileUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> UserProfileResponse:
    """Update the current user's profile information."""
    try:
        # Update user profile using the service
        updated_user = UserService.update_user_profile(
            db=db,
            user_id=current_user.id,
            full_name=profile_update.full_name,
            profile_picture_url=profile_update.profile_picture_url
        )
        
        if not updated_user:
            logger.error(f"Failed to update user profile: {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"User profile updated successfully: {current_user.email}")
        
        return UserProfileResponse(
            id=updated_user.id,
            email=updated_user.email,
            full_name=updated_user.full_name,
            profile_picture_url=updated_user.profile_picture_url,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at.isoformat(),
            updated_at=updated_user.updated_at.isoformat(),
            last_login_at=updated_user.last_login_at.isoformat() if updated_user.last_login_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )