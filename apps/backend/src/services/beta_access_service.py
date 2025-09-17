"""Service for managing beta access requests."""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from ..database import BetaAccessRequests, get_db
from datetime import datetime, timezone


class BetaAccessService:
    """Service for managing beta access requests."""
    
    @staticmethod
    def submit_request(
        db: Session,
        email: str,
        message: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> BetaAccessRequests:
        """Submit a new beta access request."""
        
        # Check if user already has a pending request
        existing_request = db.query(BetaAccessRequests).filter(
            and_(
                BetaAccessRequests.email == email,
                BetaAccessRequests.status == "pending"
            )
        ).first()
        
        if existing_request:
            # Update existing pending request with new message and timestamp
            existing_request.message = message
            existing_request.requested_at = datetime.now(timezone.utc)
            existing_request.user_agent = user_agent
            existing_request.ip_address = ip_address
            db.commit()
            db.refresh(existing_request)
            return existing_request
        
        # Create new request
        new_request = BetaAccessRequests(
            email=email,
            message=message,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        return new_request
    
    @staticmethod
    def get_requests_by_email(db: Session, email: str) -> List[BetaAccessRequests]:
        """Get all requests for a specific email."""
        return db.query(BetaAccessRequests).filter(
            BetaAccessRequests.email == email
        ).order_by(desc(BetaAccessRequests.requested_at)).all()
    
    @staticmethod
    def get_pending_requests(db: Session, limit: int = 50, offset: int = 0) -> List[BetaAccessRequests]:
        """Get all pending beta access requests."""
        return db.query(BetaAccessRequests).filter(
            BetaAccessRequests.status == "pending"
        ).order_by(desc(BetaAccessRequests.requested_at)).offset(offset).limit(limit).all()
    
    @staticmethod
    def get_all_requests(
        db: Session, 
        status: Optional[str] = None,
        limit: int = 50, 
        offset: int = 0
    ) -> List[BetaAccessRequests]:
        """Get all beta access requests with optional status filter."""
        query = db.query(BetaAccessRequests)
        
        if status:
            query = query.filter(BetaAccessRequests.status == status)
        
        return query.order_by(desc(BetaAccessRequests.requested_at)).offset(offset).limit(limit).all()
    
    @staticmethod
    def update_request_status(
        db: Session,
        request_id: int,
        status: str,
        reviewed_by_email: str,
        review_notes: Optional[str] = None
    ) -> Optional[BetaAccessRequests]:
        """Update the status of a beta access request."""
        request = db.query(BetaAccessRequests).filter(
            BetaAccessRequests.id == request_id
        ).first()
        
        if not request:
            return None
        
        request.status = status
        request.reviewed_at = datetime.now(timezone.utc)
        request.reviewed_by_email = reviewed_by_email
        request.review_notes = review_notes
        
        db.commit()
        db.refresh(request)
        
        return request
    
    @staticmethod
    def has_pending_request(db: Session, email: str) -> bool:
        """Check if user has a pending beta access request."""
        request = db.query(BetaAccessRequests).filter(
            and_(
                BetaAccessRequests.email == email,
                BetaAccessRequests.status == "pending"
            )
        ).first()
        
        return request is not None
    
    @staticmethod
    def get_request_stats(db: Session) -> dict:
        """Get statistics about beta access requests."""
        total_requests = db.query(BetaAccessRequests).count()
        pending_requests = db.query(BetaAccessRequests).filter(
            BetaAccessRequests.status == "pending"
        ).count()
        approved_requests = db.query(BetaAccessRequests).filter(
            BetaAccessRequests.status == "approved"
        ).count()
        rejected_requests = db.query(BetaAccessRequests).filter(
            BetaAccessRequests.status == "rejected"
        ).count()
        
        return {
            "total": total_requests,
            "pending": pending_requests,
            "approved": approved_requests,
            "rejected": rejected_requests
        }