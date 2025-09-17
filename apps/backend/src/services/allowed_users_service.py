"""Service for managing the friends-only access control whitelist."""

import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import AllowedUsers

logger = logging.getLogger(__name__)


class AllowedUsersService:
    """Service for managing allowed users whitelist."""
    
    @staticmethod
    def is_email_allowed(db: Session, email: str) -> bool:
        """Check if an email is in the allowed users whitelist and active."""
        try:
            allowed_user = db.query(AllowedUsers).filter(
                AllowedUsers.email == email.lower().strip(),
                AllowedUsers.is_active == True
            ).first()
            
            if allowed_user:
                # Update last_seen_at timestamp
                allowed_user.last_seen_at = datetime.now(timezone.utc)
                db.commit()
                logger.info(f"Access granted to allowed user: {email}")
                return True
            
            logger.warning(f"Access denied - email not in whitelist: {email}")
            return False
            
        except Exception as e:
            logger.error(f"Error checking email whitelist for {email}: {e}")
            # In case of database errors, we should deny access for security
            return False
    
    @staticmethod
    def add_allowed_email(
        db: Session, 
        email: str, 
        added_by_email: Optional[str] = None, 
        notes: Optional[str] = None
    ) -> AllowedUsers:
        """Add an email to the allowed users whitelist."""
        try:
            # Normalize email
            email = email.lower().strip()
            
            # Check if email already exists
            existing = db.query(AllowedUsers).filter(
                AllowedUsers.email == email
            ).first()
            
            if existing:
                if not existing.is_active:
                    # Reactivate if it was previously deactivated
                    existing.is_active = True
                    existing.added_by_email = added_by_email
                    existing.notes = notes
                    existing.added_at = datetime.now(timezone.utc)
                    db.commit()
                    logger.info(f"Reactivated allowed user: {email}")
                    return existing
                else:
                    logger.info(f"Email already in whitelist: {email}")
                    return existing
            
            # Create new allowed user entry
            allowed_user = AllowedUsers(
                email=email,
                added_by_email=added_by_email,
                notes=notes,
                is_active=True
            )
            
            db.add(allowed_user)
            db.commit()
            db.refresh(allowed_user)
            
            logger.info(f"Added new allowed user: {email} (added by: {added_by_email})")
            return allowed_user
            
        except Exception as e:
            logger.error(f"Error adding allowed email {email}: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def remove_allowed_email(db: Session, email: str) -> bool:
        """Remove an email from the allowed users whitelist (soft delete)."""
        try:
            email = email.lower().strip()
            
            allowed_user = db.query(AllowedUsers).filter(
                AllowedUsers.email == email
            ).first()
            
            if not allowed_user:
                logger.warning(f"Attempted to remove non-existent allowed user: {email}")
                return False
            
            # Soft delete - mark as inactive instead of deleting
            allowed_user.is_active = False
            db.commit()
            
            logger.info(f"Removed allowed user (soft delete): {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error removing allowed email {email}: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_allowed_users(
        db: Session, 
        active_only: bool = True, 
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get list of allowed users with pagination."""
        try:
            query = db.query(AllowedUsers)
            
            if active_only:
                query = query.filter(AllowedUsers.is_active == True)
            
            # Get total count
            total_count = query.count()
            
            # Apply pagination and ordering
            users = query.order_by(desc(AllowedUsers.added_at)).offset(offset).limit(limit).all()
            
            # Convert to list of dictionaries
            users_list = []
            for user in users:
                users_list.append({
                    "id": user.id,
                    "email": user.email,
                    "added_by_email": user.added_by_email,
                    "added_at": user.added_at.isoformat() if user.added_at else None,
                    "last_seen_at": user.last_seen_at.isoformat() if user.last_seen_at else None,
                    "is_active": user.is_active,
                    "notes": user.notes
                })
            
            return {
                "users": users_list,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "active_only": active_only
            }
            
        except Exception as e:
            logger.error(f"Error getting allowed users: {e}")
            raise
    
    @staticmethod
    def update_allowed_user(
        db: Session, 
        email: str, 
        is_active: Optional[bool] = None,
        notes: Optional[str] = None
    ) -> Optional[AllowedUsers]:
        """Update an allowed user's information."""
        try:
            email = email.lower().strip()
            
            allowed_user = db.query(AllowedUsers).filter(
                AllowedUsers.email == email
            ).first()
            
            if not allowed_user:
                logger.warning(f"Attempted to update non-existent allowed user: {email}")
                return None
            
            # Update fields if provided
            if is_active is not None:
                allowed_user.is_active = is_active
            
            if notes is not None:
                allowed_user.notes = notes
            
            db.commit()
            db.refresh(allowed_user)
            
            logger.info(f"Updated allowed user: {email}")
            return allowed_user
            
        except Exception as e:
            logger.error(f"Error updating allowed user {email}: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def bulk_add_emails(
        db: Session, 
        emails: List[str], 
        added_by_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add multiple emails to the whitelist in bulk."""
        try:
            results = {
                "added": [],
                "updated": [],
                "errors": []
            }
            
            for email in emails:
                try:
                    allowed_user = AllowedUsersService.add_allowed_email(
                        db, email, added_by_email
                    )
                    
                    # Check if it was newly added or updated
                    if allowed_user.added_at.timestamp() > (datetime.now(timezone.utc).timestamp() - 5):
                        results["added"].append(email)
                    else:
                        results["updated"].append(email)
                        
                except Exception as e:
                    results["errors"].append({"email": email, "error": str(e)})
                    logger.error(f"Error adding email {email} in bulk operation: {e}")
            
            logger.info(f"Bulk add completed: {len(results['added'])} added, {len(results['updated'])} updated, {len(results['errors'])} errors")
            return results
            
        except Exception as e:
            logger.error(f"Error in bulk add emails: {e}")
            raise