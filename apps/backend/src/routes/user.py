"""User profile routes for managing user information."""

import logging
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import get_db_dependency
from ..auth import get_current_active_user, UserResponse
from ..services.user_service import UserService
from ..services.credit_service import CreditService
from ..services.preferences_service import PreferencesService

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


class CreditStatusResponse(BaseModel):
    """Response model for user credit status."""
    credits_remaining: int
    credits_total_monthly: int
    credits_reset_date: Optional[str] = None
    plan_type: str
    is_low_credits: bool
    credits_exhausted: bool
    reset_due: bool


class CreditTransactionResponse(BaseModel):
    """Response model for credit transaction."""
    id: int
    credit_change: int
    credits_before: int
    credits_after: int
    reason: str
    conversation_id: Optional[str] = None
    description: Optional[str] = None
    created_at: str


class CreditHistoryResponse(BaseModel):
    """Response model for credit history."""
    transactions: list[CreditTransactionResponse]
    total_count: int
    limit: int
    offset: int


class UserPreferencesRequest(BaseModel):
    """Request model for updating user preferences."""
    household_size: Optional[str] = Field(None, pattern="^(small|medium|large)$")
    dietary_restrictions: Optional[List[str]] = Field(None, max_length=10)
    budget_preference: Optional[str] = Field(None, pattern="^(budget|moderate|premium)$")
    primary_sites: Optional[List[str]] = Field(None, max_length=10)
    shopping_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")
    language_preference: Optional[str] = Field(None, pattern="^(en|he)$")
    preferred_categories: Optional[List[str]] = Field(None, max_length=20)
    brand_preferences: Optional[List[str]] = Field(None, max_length=20)
    special_considerations: Optional[List[str]] = Field(None, max_length=10)


class OnboardingRequest(BaseModel):
    """Request model for completing onboarding."""
    household_size: Optional[str] = Field(None, pattern="^(small|medium|large)$")
    dietary_restrictions: Optional[List[str]] = Field(default=[], max_length=10)
    budget_preference: Optional[str] = Field(None, pattern="^(budget|moderate|premium)$")
    primary_sites: Optional[List[str]] = Field(default=[], max_length=10)
    shopping_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly)$")
    language_preference: str = Field(default="en", pattern="^(en|he)$")
    preferred_categories: Optional[List[str]] = Field(default=[], max_length=20)
    brand_preferences: Optional[List[str]] = Field(default=[], max_length=20)
    special_considerations: Optional[List[str]] = Field(default=[], max_length=10)


class UserPreferencesResponse(BaseModel):
    """Response model for user preferences."""
    id: str
    user_id: str
    household_size: Optional[str]
    dietary_restrictions: List[str]
    budget_preference: Optional[str]
    primary_sites: List[str]
    shopping_frequency: Optional[str]
    language_preference: str
    preferred_categories: List[str]
    brand_preferences: List[str]
    special_considerations: List[str]
    onboarding_completed: bool
    onboarding_completed_at: Optional[str]
    created_at: str
    updated_at: str


class OnboardingStatusResponse(BaseModel):
    """Response model for onboarding status."""
    onboarding_completed: bool
    onboarding_completed_at: Optional[str]
    preferences_exist: bool


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


@router.get("/credits", response_model=CreditStatusResponse)
async def get_user_credits(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> CreditStatusResponse:
    """Get the current user's credit status."""
    try:
        credit_status = CreditService.get_user_credit_status(db, current_user.id)
        return CreditStatusResponse(**credit_status)
        
    except Exception as e:
        logger.error(f"Error getting credit status for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get credit status"
        )


@router.get("/credit-history", response_model=CreditHistoryResponse)
async def get_user_credit_history(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency),
    limit: int = Query(default=20, ge=1, le=100, description="Number of transactions to return"),
    offset: int = Query(default=0, ge=0, description="Number of transactions to skip")
) -> CreditHistoryResponse:
    """Get the current user's credit transaction history."""
    try:
        history_data = CreditService.get_credit_history(db, current_user.id, limit, offset)
        
        # Convert transaction data to response models
        transactions = [
            CreditTransactionResponse(**transaction)
            for transaction in history_data["transactions"]
        ]
        
        return CreditHistoryResponse(
            transactions=transactions,
            total_count=history_data["total_count"],
            limit=history_data["limit"],
            offset=history_data["offset"]
        )
        
    except Exception as e:
        logger.error(f"Error getting credit history for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get credit history"
        )


@router.get("/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> UserPreferencesResponse:
    """Get the current user's preferences and onboarding data."""
    try:
        preferences = PreferencesService.get_or_create_preferences(db, current_user.id)
        
        return UserPreferencesResponse(
            id=preferences.id,
            user_id=preferences.user_id,
            household_size=preferences.household_size,
            dietary_restrictions=preferences.dietary_restrictions or [],
            budget_preference=preferences.budget_preference,
            primary_sites=preferences.primary_sites or [],
            shopping_frequency=preferences.shopping_frequency,
            language_preference=preferences.language_preference,
            preferred_categories=preferences.preferred_categories or [],
            brand_preferences=preferences.brand_preferences or [],
            special_considerations=preferences.special_considerations or [],
            onboarding_completed=preferences.onboarding_completed,
            onboarding_completed_at=preferences.onboarding_completed_at.isoformat() if preferences.onboarding_completed_at else None,
            created_at=preferences.created_at.isoformat(),
            updated_at=preferences.updated_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error getting user preferences for {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user preferences"
        )


@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> UserPreferencesResponse:
    """Update the current user's preferences."""
    try:
        # Convert request to dict, excluding None values
        preferences_data = preferences_update.dict(exclude_none=True)
        
        preferences = PreferencesService.update_preferences(
            db, current_user.id, preferences_data
        )
        
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        
        logger.info(f"User preferences updated for {current_user.email}")
        
        return UserPreferencesResponse(
            id=preferences.id,
            user_id=preferences.user_id,
            household_size=preferences.household_size,
            dietary_restrictions=preferences.dietary_restrictions or [],
            budget_preference=preferences.budget_preference,
            primary_sites=preferences.primary_sites or [],
            shopping_frequency=preferences.shopping_frequency,
            language_preference=preferences.language_preference,
            preferred_categories=preferences.preferred_categories or [],
            brand_preferences=preferences.brand_preferences or [],
            special_considerations=preferences.special_considerations or [],
            onboarding_completed=preferences.onboarding_completed,
            onboarding_completed_at=preferences.onboarding_completed_at.isoformat() if preferences.onboarding_completed_at else None,
            created_at=preferences.created_at.isoformat(),
            updated_at=preferences.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences for {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user preferences"
        )


@router.post("/onboarding", response_model=UserPreferencesResponse)
async def complete_user_onboarding(
    onboarding_data: OnboardingRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> UserPreferencesResponse:
    """Complete user onboarding with collected preferences data."""
    try:
        # Convert request to dict, excluding None values
        preferences_data = onboarding_data.dict(exclude_none=True)
        
        preferences = PreferencesService.complete_onboarding(
            db, current_user.id, preferences_data
        )
        
        logger.info(f"Onboarding completed for user {current_user.email}")
        
        return UserPreferencesResponse(
            id=preferences.id,
            user_id=preferences.user_id,
            household_size=preferences.household_size,
            dietary_restrictions=preferences.dietary_restrictions or [],
            budget_preference=preferences.budget_preference,
            primary_sites=preferences.primary_sites or [],
            shopping_frequency=preferences.shopping_frequency,
            language_preference=preferences.language_preference,
            preferred_categories=preferences.preferred_categories or [],
            brand_preferences=preferences.brand_preferences or [],
            special_considerations=preferences.special_considerations or [],
            onboarding_completed=preferences.onboarding_completed,
            onboarding_completed_at=preferences.onboarding_completed_at.isoformat() if preferences.onboarding_completed_at else None,
            created_at=preferences.created_at.isoformat(),
            updated_at=preferences.updated_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error completing onboarding for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete onboarding"
        )


@router.get("/onboarding-status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> OnboardingStatusResponse:
    """Get the current user's onboarding completion status."""
    try:
        preferences = PreferencesService.get_user_preferences(db, current_user.id)
        
        if not preferences:
            return OnboardingStatusResponse(
                onboarding_completed=False,
                onboarding_completed_at=None,
                preferences_exist=False
            )
        
        return OnboardingStatusResponse(
            onboarding_completed=preferences.onboarding_completed,
            onboarding_completed_at=preferences.onboarding_completed_at.isoformat() if preferences.onboarding_completed_at else None,
            preferences_exist=True
        )
        
    except Exception as e:
        logger.error(f"Error getting onboarding status for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get onboarding status"
        )