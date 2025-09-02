"""User service for database operations."""

import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from uuid import uuid4

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError, DisconnectionError

from ..database import User, TokenBlacklist, UserSession

logger = logging.getLogger(__name__)


def retry_db_operation(max_retries=3, delay=1.0):
    """Decorator to retry database operations on connection errors."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (OperationalError, DisconnectionError) as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Database operation failed (attempt {attempt + 1}/{max_retries}): {e}")
                        time.sleep(delay * (2 ** attempt))  # Exponential backoff
                        # Try to rollback the session if it exists
                        if len(args) > 1 and hasattr(args[1], 'rollback'):
                            try:
                                args[1].rollback()
                            except Exception:
                                pass
                    else:
                        logger.error(f"Database operation failed after {max_retries} attempts: {e}")
                        raise last_exception
                except Exception as e:
                    # Don't retry for other types of exceptions
                    raise e
            return None
        return wrapper
    return decorator


class UserService:
    """Service for user-related database operations."""
    
    @staticmethod
    @retry_db_operation(max_retries=3, delay=0.5)
    def get_or_create_user(
        db: Session, 
        email: str, 
        google_user_info: Optional[Dict[str, Any]] = None
    ) -> User:
        """Get existing user or create new one."""
        try:
            # Try to find existing user
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                # Update last login and user info if provided
                user.last_login_at = datetime.now(timezone.utc)
                if google_user_info:
                    if google_user_info.get("name") and not user.full_name:
                        user.full_name = google_user_info["name"]
                    if google_user_info.get("picture") and not user.profile_picture_url:
                        user.profile_picture_url = google_user_info["picture"]
                    if google_user_info.get("sub") and not user.google_id:
                        user.google_id = google_user_info["sub"]
                
                db.commit()
                logger.info(f"Updated existing user: {email}")
                return user
            
            # Create new user
            user_data = {
                "email": email,
                "last_login_at": datetime.now(timezone.utc)
            }
            
            if google_user_info:
                user_data.update({
                    "full_name": google_user_info.get("name"),
                    "profile_picture_url": google_user_info.get("picture"),
                    "google_id": google_user_info.get("sub")
                })
            
            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Created new user: {email}")
            return user
            
        except IntegrityError as e:
            db.rollback()
            # Handle race condition - try to get existing user
            user = db.query(User).filter(User.email == email).first()
            if user:
                return user
            logger.error(f"Error creating user {email}: {e}")
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error in get_or_create_user for {email}: {e}")
            raise
    
    @staticmethod
    @retry_db_operation(max_retries=3, delay=0.5)
    def blacklist_token(
        db: Session,
        token_jti: str,
        user_id: str,
        user_email: str,
        expires_at: datetime,
        reason: str = "logout"
    ) -> TokenBlacklist:
        """Add token to blacklist."""
        try:
            # Check if already blacklisted
            existing = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_jti == token_jti
            ).first()
            
            if existing:
                logger.info(f"Token already blacklisted: {token_jti[:20]}...")
                return existing
            
            blacklisted_token = TokenBlacklist(
                token_jti=token_jti,
                user_id=user_id,
                user_email=user_email,
                expires_at=expires_at,
                reason=reason
            )
            
            db.add(blacklisted_token)
            db.commit()
            db.refresh(blacklisted_token)
            
            logger.info(f"Token blacklisted for user {user_email}: {token_jti[:20]}...")
            return blacklisted_token
            
        except IntegrityError:
            db.rollback()
            # Token already exists, return existing
            return db.query(TokenBlacklist).filter(
                TokenBlacklist.token_jti == token_jti
            ).first()
        except Exception as e:
            db.rollback()
            logger.error(f"Error blacklisting token: {e}")
            raise
    
    @staticmethod
    @retry_db_operation(max_retries=3, delay=0.5)
    def is_token_blacklisted(db: Session, token_jti: str) -> bool:
        """Check if token is blacklisted."""
        try:
            blacklisted = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_jti == token_jti
            ).first()
            
            return blacklisted is not None
            
        except Exception as e:
            logger.error(f"Error checking token blacklist: {e}")
            # In case of error, assume token is valid to avoid blocking users
            return False
    
    @staticmethod
    @retry_db_operation(max_retries=3, delay=0.5)
    def create_user_session(
        db: Session,
        user_id: str,
        user_email: str,
        token_jti: str,
        expires_at: datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserSession:
        """Create a new user session record."""
        try:
            session = UserSession(
                user_id=user_id,
                user_email=user_email,
                session_token_jti=token_jti,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=expires_at
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
            
            logger.info(f"Created session for user {user_email}")
            return session
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user session: {e}")
            raise
    
    @staticmethod
    def end_user_session(
        db: Session,
        token_jti: str,
        reason: str = "logout"
    ) -> Optional[UserSession]:
        """End a user session."""
        try:
            session = db.query(UserSession).filter(
                UserSession.session_token_jti == token_jti,
                UserSession.is_active == True
            ).first()
            
            if session:
                session.is_active = False
                session.logout_at = datetime.now(timezone.utc)
                session.logout_reason = reason
                
                db.commit()
                logger.info(f"Ended session for user {session.user_email}")
            
            return session
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error ending user session: {e}")
            raise
    
    @staticmethod
    def get_active_sessions_count(db: Session, user_id: str) -> int:
        """Get count of active sessions for user."""
        try:
            return db.query(UserSession).filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc)
            ).count()
            
        except Exception as e:
            logger.error(f"Error getting active sessions count: {e}")
            return 0