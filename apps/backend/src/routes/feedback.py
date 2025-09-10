"""Feedback routes for collecting user feedback."""

import logging
from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from typing import Literal

from ..database import get_db_dependency, UserFeedback
from ..auth import get_current_active_user, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()


class FeedbackSubmission(BaseModel):
    """Request model for submitting user feedback."""
    type: Literal["bug", "feature", "general", "improvement"] = Field(
        ..., description="Type of feedback"
    )
    subject: str = Field(
        ..., description="Brief description of the feedback"
    )
    message: str = Field(
        ..., description="Detailed feedback message"
    )
    
    @validator('subject')
    def validate_subject(cls, v):
        if v is not None:
            v = v.strip()
            # Count Unicode characters properly
            char_count = len(v)
            if char_count < 3:
                raise ValueError('Subject must be at least 3 characters long')
            if char_count > 255:
                raise ValueError('Subject must not exceed 255 characters')
        return v
    
    @validator('message')
    def validate_message(cls, v):
        if v is not None:
            v = v.strip()
            # Count Unicode characters properly
            char_count = len(v)
            if char_count < 5:  # Reduced minimum for better UX with Hebrew
                raise ValueError('Message must be at least 5 characters long')
            if char_count > 2000:
                raise ValueError('Message must not exceed 2000 characters')
        return v


class FeedbackResponse(BaseModel):
    """Response model for submitted feedback."""
    id: str
    type: str
    subject: str
    message: str
    status: str
    created_at: str
    
    class Config:
        from_attributes = True


@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackSubmission,
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency)
) -> FeedbackResponse:
    """Submit user feedback."""
    try:
        # Create new feedback record
        db_feedback = UserFeedback(
            user_id=current_user.id,
            user_email=current_user.email,
            feedback_type=feedback.type,
            subject=feedback.subject.strip(),
            message=feedback.message.strip(),
            status="open"
        )
        
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        
        logger.info(
            f"Feedback submitted successfully - ID: {db_feedback.id}, "
            f"Type: {db_feedback.feedback_type}, User: {current_user.email}"
        )
        
        return FeedbackResponse(
            id=db_feedback.id,
            type=db_feedback.feedback_type,
            subject=db_feedback.subject,
            message=db_feedback.message,
            status=db_feedback.status,
            created_at=db_feedback.created_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error submitting feedback for user {current_user.email}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit feedback. Please try again later."
        )


@router.get("/my-feedback")
async def get_user_feedback(
    current_user: UserResponse = Depends(get_current_active_user),
    db: Session = Depends(get_db_dependency),
    limit: int = Query(default=20, ge=1, le=100, description="Number of feedback items to return"),
    offset: int = Query(default=0, ge=0, description="Number of feedback items to skip")
):
    """Get current user's feedback history."""
    try:
        # Query user's feedback ordered by creation date (newest first)
        feedback_query = db.query(UserFeedback).filter(
            UserFeedback.user_id == current_user.id
        ).order_by(UserFeedback.created_at.desc())
        
        # Get total count for pagination
        total_count = feedback_query.count()
        
        # Apply pagination
        feedback_items = feedback_query.offset(offset).limit(limit).all()
        
        # Convert to response format
        feedback_list = [
            FeedbackResponse(
                id=item.id,
                type=item.feedback_type,
                subject=item.subject,
                message=item.message,
                status=item.status,
                created_at=item.created_at.isoformat()
            )
            for item in feedback_items
        ]
        
        return {
            "feedback": feedback_list,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error getting feedback for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve feedback history"
        )