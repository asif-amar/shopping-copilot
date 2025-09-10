"""Credit management service for user credit tracking and operations."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import User, UserCreditLog
from ..config import config

logger = logging.getLogger(__name__)


class InsufficientCreditsError(Exception):
    """Raised when user doesn't have enough credits for an operation."""
    
    def __init__(self, user_id: str, required: int, available: int):
        self.user_id = user_id
        self.required = required
        self.available = available
        super().__init__(f"Insufficient credits for user {user_id}: required {required}, available {available}")


class CreditService:
    """Service for managing user credits and transactions."""
    
    @staticmethod
    def get_user_credit_status(db: Session, user_id: str) -> Dict[str, Any]:
        """Get comprehensive credit status for a user."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Check if monthly reset is due
            reset_due = CreditService._check_monthly_reset_due(user)
            if reset_due:
                CreditService.reset_monthly_credits(db, user_id)
                # Refresh user data after reset
                db.refresh(user)
            
            return {
                "credits_remaining": user.credits_remaining,
                "credits_total_monthly": user.credits_total_monthly,
                "credits_reset_date": user.credits_reset_date.isoformat() if user.credits_reset_date else None,
                "plan_type": user.plan_type,
                "is_low_credits": user.credits_remaining <= config.CREDIT_LOW_WARNING_THRESHOLD,
                "credits_exhausted": user.credits_remaining <= 0,
                "reset_due": reset_due
            }
            
        except Exception as e:
            logger.error(f"Error getting credit status for user {user_id}: {e}")
            raise
    
    @staticmethod
    def check_credit_availability(db: Session, user_id: str, credits_needed: int = 1) -> bool:
        """Check if user has enough credits for an operation."""
        try:
            status = CreditService.get_user_credit_status(db, user_id)
            return status["credits_remaining"] >= credits_needed
        except Exception as e:
            logger.error(f"Error checking credit availability for user {user_id}: {e}")
            return False
    
    @staticmethod
    def deduct_credit(
        db: Session, 
        user_id: str, 
        reason: str, 
        conversation_id: Optional[str] = None,
        description: Optional[str] = None,
        credits_to_deduct: int = 1
    ) -> Dict[str, Any]:
        """
        Deduct credits from user account and log the transaction.
        
        Args:
            db: Database session
            user_id: User identifier
            reason: Reason for deduction (conversation, test, etc.)
            conversation_id: Optional conversation ID for tracking
            description: Optional additional description
            credits_to_deduct: Number of credits to deduct (default: 1)
            
        Returns:
            Dict with transaction details
            
        Raises:
            InsufficientCreditsError: If user doesn't have enough credits
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Check if monthly reset is due first
            if CreditService._check_monthly_reset_due(user):
                CreditService.reset_monthly_credits(db, user_id)
                db.refresh(user)
            
            # Check if user has enough credits
            if user.credits_remaining < credits_to_deduct:
                raise InsufficientCreditsError(user_id, credits_to_deduct, user.credits_remaining)
            
            # Store before/after values
            credits_before = user.credits_remaining
            credits_after = credits_before - credits_to_deduct
            
            # Deduct credits
            user.credits_remaining = credits_after
            user.updated_at = datetime.now(timezone.utc)
            
            # Log the transaction
            log_entry = UserCreditLog(
                user_id=user_id,
                user_email=user.email,
                credit_change=-credits_to_deduct,
                credits_before=credits_before,
                credits_after=credits_after,
                reason=reason,
                conversation_id=conversation_id,
                description=description
            )
            
            db.add(log_entry)
            db.commit()
            
            logger.info(
                f"Deducted {credits_to_deduct} credit(s) from user {user.email} "
                f"({credits_before} -> {credits_after}) for reason: {reason}"
            )
            
            return {
                "user_id": user_id,
                "credits_deducted": credits_to_deduct,
                "credits_before": credits_before,
                "credits_after": credits_after,
                "reason": reason,
                "conversation_id": conversation_id,
                "log_id": log_entry.id
            }
            
        except InsufficientCreditsError:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error deducting credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    def refund_credit(
        db: Session,
        user_id: str,
        reason: str,
        conversation_id: Optional[str] = None,
        description: Optional[str] = None,
        credits_to_refund: int = 1
    ) -> Dict[str, Any]:
        """
        Refund credits to user account and log the transaction.
        
        Args:
            db: Database session
            user_id: User identifier
            reason: Reason for refund (error, failed_response, etc.)
            conversation_id: Optional conversation ID for tracking
            description: Optional additional description
            credits_to_refund: Number of credits to refund (default: 1)
            
        Returns:
            Dict with transaction details
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Store before/after values
            credits_before = user.credits_remaining
            credits_after = credits_before + credits_to_refund
            
            # Don't exceed monthly allowance
            if credits_after > user.credits_total_monthly:
                credits_after = user.credits_total_monthly
                credits_to_refund = credits_after - credits_before
            
            # Add credits
            user.credits_remaining = credits_after
            user.updated_at = datetime.now(timezone.utc)
            
            # Log the transaction
            log_entry = UserCreditLog(
                user_id=user_id,
                user_email=user.email,
                credit_change=credits_to_refund,
                credits_before=credits_before,
                credits_after=credits_after,
                reason=reason,
                conversation_id=conversation_id,
                description=description
            )
            
            db.add(log_entry)
            db.commit()
            
            logger.info(
                f"Refunded {credits_to_refund} credit(s) to user {user.email} "
                f"({credits_before} -> {credits_after}) for reason: {reason}"
            )
            
            return {
                "user_id": user_id,
                "credits_refunded": credits_to_refund,
                "credits_before": credits_before,
                "credits_after": credits_after,
                "reason": reason,
                "conversation_id": conversation_id,
                "log_id": log_entry.id
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error refunding credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    def reset_monthly_credits(db: Session, user_id: str) -> Dict[str, Any]:
        """
        Reset user's monthly credits and set next reset date.
        
        Args:
            db: Database session
            user_id: User identifier
            
        Returns:
            Dict with reset details
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            credits_before = user.credits_remaining
            credits_after = user.credits_total_monthly
            
            # Reset credits
            user.credits_remaining = credits_after
            user.credits_reset_date = CreditService._calculate_next_reset_date()
            user.updated_at = datetime.now(timezone.utc)
            
            # Log the reset
            log_entry = UserCreditLog(
                user_id=user_id,
                user_email=user.email,
                credit_change=credits_after - credits_before,
                credits_before=credits_before,
                credits_after=credits_after,
                reason="monthly_reset",
                description=f"Monthly credit reset - {user.plan_type} plan"
            )
            
            db.add(log_entry)
            db.commit()
            
            logger.info(
                f"Reset monthly credits for user {user.email} "
                f"({credits_before} -> {credits_after}) - next reset: {user.credits_reset_date}"
            )
            
            return {
                "user_id": user_id,
                "credits_before": credits_before,
                "credits_after": credits_after,
                "reset_date": user.credits_reset_date.isoformat(),
                "plan_type": user.plan_type,
                "log_id": log_entry.id
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error resetting monthly credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    def initialize_user_credits(
        db: Session, 
        user_id: str, 
        plan_type: str = "free"
    ) -> Dict[str, Any]:
        """
        Initialize credits for a new user.
        
        Args:
            db: Database session
            user_id: User identifier
            plan_type: User plan type (default: "free")
            
        Returns:
            Dict with initialization details
        """
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User not found: {user_id}")
            
            # Set initial credits based on plan
            initial_credits = config.DEFAULT_MONTHLY_CREDITS
            
            user.credits_remaining = initial_credits
            user.credits_total_monthly = initial_credits
            user.credits_reset_date = CreditService._calculate_next_reset_date()
            user.plan_type = plan_type
            user.updated_at = datetime.now(timezone.utc)
            
            # Log the initialization
            log_entry = UserCreditLog(
                user_id=user_id,
                user_email=user.email,
                credit_change=initial_credits,
                credits_before=0,
                credits_after=initial_credits,
                reason="account_creation",
                description=f"Initial credits for {plan_type} plan"
            )
            
            db.add(log_entry)
            db.commit()
            
            logger.info(
                f"Initialized credits for new user {user.email}: "
                f"{initial_credits} credits ({plan_type} plan)"
            )
            
            return {
                "user_id": user_id,
                "initial_credits": initial_credits,
                "plan_type": plan_type,
                "reset_date": user.credits_reset_date.isoformat(),
                "log_id": log_entry.id
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error initializing credits for user {user_id}: {e}")
            raise
    
    @staticmethod
    def get_credit_history(
        db: Session,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get credit transaction history for a user.
        
        Args:
            db: Database session
            user_id: User identifier
            limit: Number of records to return
            offset: Number of records to skip
            
        Returns:
            Dict with transaction history
        """
        try:
            # Get total count
            total_count = db.query(UserCreditLog).filter(
                UserCreditLog.user_id == user_id
            ).count()
            
            # Get transactions
            transactions = db.query(UserCreditLog).filter(
                UserCreditLog.user_id == user_id
            ).order_by(UserCreditLog.created_at.desc()).offset(offset).limit(limit).all()
            
            # Format response
            history = []
            for transaction in transactions:
                history.append({
                    "id": transaction.id,
                    "credit_change": transaction.credit_change,
                    "credits_before": transaction.credits_before,
                    "credits_after": transaction.credits_after,
                    "reason": transaction.reason,
                    "conversation_id": transaction.conversation_id,
                    "description": transaction.description,
                    "created_at": transaction.created_at.isoformat()
                })
            
            return {
                "transactions": history,
                "total_count": total_count,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error getting credit history for user {user_id}: {e}")
            raise
    
    @staticmethod
    def _check_monthly_reset_due(user: User) -> bool:
        """Check if monthly credit reset is due for a user."""
        if not user.credits_reset_date:
            return True  # First time setup
        
        now = datetime.now(timezone.utc)
        return now >= user.credits_reset_date
    
    @staticmethod
    def _calculate_next_reset_date() -> datetime:
        """Calculate the next monthly reset date by adding 1 month to current date."""
        now = datetime.now(timezone.utc)
        # Add 1 month to the current date
        if now.month == 12:
            next_reset = now.replace(year=now.year + 1, month=1)
        else:
            next_reset = now.replace(month=now.month + 1)
        return next_reset
    
    @staticmethod
    def should_refund_for_response(response_content: str) -> bool:
        """
        Determine if credits should be refunded based on LLM response content.
        
        This checks for responses that indicate errors, refresh requests, or other
        scenarios where credits should not be charged.
        
        Args:
            response_content: The LLM response content
            
        Returns:
            bool: True if credits should be refunded
        """
        if not response_content:
            return True
        
        # Check for common error/refresh indicators (case insensitive)
        refund_indicators = [
            "refresh the page",
            "רענן את הדף",  # Hebrew: refresh the page
            "נסה לרענן",    # Hebrew: try to refresh
            "credentials are missing",
            "invalid credentials",
            "authentication failed",
            "שגיאה בהתחברות",  # Hebrew: login error
            "לא ניתן להתחבר", # Hebrew: cannot connect
            "internal server error",
            "something went wrong",
            "error occurred",
            "שגיאה פנימית",   # Hebrew: internal error
            "קרתה שגיאה"     # Hebrew: an error occurred
        ]
        
        response_lower = response_content.lower()
        return any(indicator in response_lower for indicator in refund_indicators)