"""Admin routes for managing friends-only access control."""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..auth import get_current_user, UserResponse
from ..database import get_db_dependency
from ..services.allowed_users_service import AllowedUsersService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

# Configuration - you can change this email to your admin email
ADMIN_EMAIL = "liorlivyatan@gmail.com"  # Replace with your email


def get_admin_user(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Verify that the current user is an admin."""
    if current_user.email.lower() != ADMIN_EMAIL.lower():
        logger.warning(f"Non-admin user attempted to access admin endpoint: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Request/Response models
class AddAllowedUserRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address to add to whitelist")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes about the user")


class BulkAddUsersRequest(BaseModel):
    emails: List[EmailStr] = Field(..., min_items=1, max_items=50, description="List of emails to add")


class UpdateAllowedUserRequest(BaseModel):
    is_active: Optional[bool] = Field(None, description="Whether the user should be active")
    notes: Optional[str] = Field(None, max_length=500, description="Notes about the user")


class AllowedUserResponse(BaseModel):
    id: int
    email: str
    added_by_email: Optional[str]
    added_at: Optional[str]
    last_seen_at: Optional[str]
    is_active: bool
    notes: Optional[str]


class AllowedUsersListResponse(BaseModel):
    users: List[AllowedUserResponse]
    total_count: int
    limit: int
    offset: int
    active_only: bool


class BulkOperationResponse(BaseModel):
    added: List[str]
    updated: List[str]
    errors: List[Dict[str, str]]


@router.get("/allowed-users", response_model=AllowedUsersListResponse)
def get_allowed_users(
    active_only: bool = Query(True, description="Show only active users"),
    limit: int = Query(100, ge=1, le=500, description="Number of users to return"),
    offset: int = Query(0, ge=0, description="Number of users to skip"),
    admin_user: UserResponse = Depends(get_admin_user),
    db: Session = Depends(get_db_dependency)
):
    """Get list of allowed users with pagination."""
    try:
        result = AllowedUsersService.get_allowed_users(
            db=db,
            active_only=active_only,
            limit=limit,
            offset=offset
        )
        
        logger.info(f"Admin {admin_user.email} retrieved allowed users list (active_only={active_only})")
        return AllowedUsersListResponse(**result)
        
    except Exception as e:
        logger.error(f"Error retrieving allowed users for admin {admin_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve allowed users"
        )


@router.post("/allowed-users")
def add_allowed_user(
    request: AddAllowedUserRequest,
    admin_user: UserResponse = Depends(get_admin_user),
    db: Session = Depends(get_db_dependency)
):
    """Add a single email to the allowed users whitelist."""
    try:
        allowed_user = AllowedUsersService.add_allowed_email(
            db=db,
            email=str(request.email),
            added_by_email=admin_user.email,
            notes=request.notes
        )
        
        logger.info(f"Admin {admin_user.email} added allowed user: {request.email}")
        
        return {
            "message": f"Successfully added {request.email} to the whitelist",
            "user": {
                "id": allowed_user.id,
                "email": allowed_user.email,
                "added_by_email": allowed_user.added_by_email,
                "added_at": allowed_user.added_at.isoformat() if allowed_user.added_at else None,
                "is_active": allowed_user.is_active,
                "notes": allowed_user.notes
            }
        }
        
    except Exception as e:
        logger.error(f"Error adding allowed user {request.email} by admin {admin_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add {request.email} to the whitelist"
        )


@router.post("/allowed-users/bulk", response_model=BulkOperationResponse)
def bulk_add_allowed_users(
    request: BulkAddUsersRequest,
    admin_user: UserResponse = Depends(get_admin_user),
    db: Session = Depends(get_db_dependency)
):
    """Add multiple emails to the allowed users whitelist."""
    try:
        # Convert EmailStr objects to strings
        emails = [str(email) for email in request.emails]
        
        result = AllowedUsersService.bulk_add_emails(
            db=db,
            emails=emails,
            added_by_email=admin_user.email
        )
        
        logger.info(f"Admin {admin_user.email} performed bulk add: {len(emails)} emails")
        return BulkOperationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in bulk add by admin {admin_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk add operation"
        )


@router.put("/allowed-users/{email}")
def update_allowed_user(
    email: str,
    request: UpdateAllowedUserRequest,
    admin_user: UserResponse = Depends(get_admin_user),
    db: Session = Depends(get_db_dependency)
):
    """Update an allowed user's information."""
    try:
        allowed_user = AllowedUsersService.update_allowed_user(
            db=db,
            email=email,
            is_active=request.is_active,
            notes=request.notes
        )
        
        if not allowed_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {email} not found in whitelist"
            )
        
        logger.info(f"Admin {admin_user.email} updated allowed user: {email}")
        
        return {
            "message": f"Successfully updated {email}",
            "user": {
                "id": allowed_user.id,
                "email": allowed_user.email,
                "added_by_email": allowed_user.added_by_email,
                "added_at": allowed_user.added_at.isoformat() if allowed_user.added_at else None,
                "last_seen_at": allowed_user.last_seen_at.isoformat() if allowed_user.last_seen_at else None,
                "is_active": allowed_user.is_active,
                "notes": allowed_user.notes
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating allowed user {email} by admin {admin_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update {email}"
        )


@router.delete("/allowed-users/{email}")
def remove_allowed_user(
    email: str,
    admin_user: UserResponse = Depends(get_admin_user),
    db: Session = Depends(get_db_dependency)
):
    """Remove an email from the allowed users whitelist."""
    try:
        success = AllowedUsersService.remove_allowed_email(db=db, email=email)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {email} not found in whitelist"
            )
        
        logger.info(f"Admin {admin_user.email} removed allowed user: {email}")
        
        return {
            "message": f"Successfully removed {email} from the whitelist"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing allowed user {email} by admin {admin_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove {email} from the whitelist"
        )


@router.get("/allowed-users/{email}/check")
def check_user_access(
    email: str,
    admin_user: UserResponse = Depends(get_admin_user),
    db: Session = Depends(get_db_dependency)
):
    """Check if a specific email has access."""
    try:
        is_allowed = AllowedUsersService.is_email_allowed(db=db, email=email)
        
        return {
            "email": email,
            "is_allowed": is_allowed,
            "message": f"{email} {'has' if is_allowed else 'does not have'} access to the extension"
        }
        
    except Exception as e:
        logger.error(f"Error checking access for {email} by admin {admin_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check access for {email}"
        )