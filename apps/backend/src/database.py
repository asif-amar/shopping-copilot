"""Database models and connection management."""

import logging
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Index, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from sqlalchemy.sql import func

from .config import config

logger = logging.getLogger(__name__)

# Create database engine with connection pooling and retry logic
engine = create_engine(
    config.DATABASE_URL,
    # Connection pool settings for better connection management
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,  # Recycle connections every 30 minutes
    pool_pre_ping=True,  # Enable connection health checks
    # Additional settings for Neon/serverless databases
    connect_args={
        "connect_timeout": 10,
        "application_name": "shopping_copilot_backend",
    },
    # Only echo SQL queries when LOG_LEVEL is DEBUG
    echo=config.LOG_LEVEL.upper() == "DEBUG"
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """User model for storing user information."""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    profile_picture_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Credit system fields
    credits_remaining = Column(Integer, default=50, nullable=False)
    credits_total_monthly = Column(Integer, default=50, nullable=False)
    credits_reset_date = Column(DateTime(timezone=True), nullable=True)
    plan_type = Column(String(20), default="free", nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    preferences = relationship("UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class TokenBlacklist(Base):
    """Model for storing blacklisted JWT tokens."""
    __tablename__ = "token_blacklist"
    
    id = Column(Integer, primary_key=True, index=True)
    token_jti = Column(String(255), unique=True, index=True, nullable=False)  # JWT ID claim
    user_id = Column(String(36), index=True, nullable=False)
    user_email = Column(String(255), index=True, nullable=False)
    blacklisted_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  # When the original token expires
    reason = Column(String(100), default="logout", nullable=False)  # logout, revoked, etc.
    
    # Index for efficient cleanup of expired tokens
    __table_args__ = (
        Index('idx_expires_at', 'expires_at'),
        Index('idx_user_blacklisted', 'user_id', 'blacklisted_at'),
    )
    
    def __repr__(self):
        return f"<TokenBlacklist(jti='{self.token_jti}', user_email='{self.user_email}')>"


class UserSession(Base):
    """Model for tracking user sessions and login history."""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    user_email = Column(String(255), index=True, nullable=False)
    session_token_jti = Column(String(255), index=True, nullable=False)  # JWT ID
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_activity_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    logout_at = Column(DateTime(timezone=True), nullable=True)
    logout_reason = Column(String(50), nullable=True)  # manual, expired, revoked
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_email='{self.user_email}', active={self.is_active})>"


class UserFeedback(Base):
    """Model for storing user feedback and feature requests."""
    __tablename__ = "user_feedback"
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), index=True, nullable=False)
    user_email = Column(String(255), index=True, nullable=False)
    feedback_type = Column(String(20), nullable=False)  # bug, feature, general, improvement
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="open", nullable=False)  # open, acknowledged, resolved, closed
    priority = Column(String(10), default="medium", nullable=True)  # low, medium, high, critical
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_feedback_user_created', 'user_id', 'created_at'),
        Index('idx_feedback_type_status', 'feedback_type', 'status'),
        Index('idx_feedback_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<UserFeedback(id={self.id}, type='{self.feedback_type}', user_email='{self.user_email}')>"


class UserCreditLog(Base):
    """Model for tracking credit transactions and usage history."""
    __tablename__ = "user_credit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    user_email = Column(String(255), index=True, nullable=False)
    credit_change = Column(Integer, nullable=False)  # Positive for additions, negative for deductions
    credits_before = Column(Integer, nullable=False)
    credits_after = Column(Integer, nullable=False)
    reason = Column(String(50), nullable=False)  # conversation, refund, monthly_reset, manual_adjustment
    conversation_id = Column(String(255), nullable=True)  # For conversation-related transactions
    description = Column(String(500), nullable=True)  # Additional details
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_credit_log_user_created', 'user_id', 'created_at'),
        Index('idx_credit_log_conversation', 'conversation_id'),
        Index('idx_credit_log_reason', 'reason'),
        Index('idx_credit_log_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<UserCreditLog(id={self.id}, user_email='{self.user_email}', change={self.credit_change}, reason='{self.reason}')>"


class AllowedUsers(Base):
    """Model for managing friends-only access control whitelist."""
    __tablename__ = "allowed_users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    added_by_email = Column(String(255), index=True, nullable=True)  # Admin who added this user
    added_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)  # Track when user last accessed the system
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)  # Optional notes about the user
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_allowed_users_email_active', 'email', 'is_active'),
        Index('idx_allowed_users_added_by', 'added_by_email'),
        Index('idx_allowed_users_last_seen', 'last_seen_at'),
    )
    
    def __repr__(self):
        return f"<AllowedUsers(email='{self.email}', is_active={self.is_active}, added_by='{self.added_by_email}')>"


class BetaAccessRequests(Base):
    """Model for storing beta access requests from users."""
    __tablename__ = "beta_access_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True, nullable=False)
    message = Column(Text, nullable=True)  # Optional message from user
    status = Column(String(50), default="pending", nullable=False)  # pending, approved, rejected
    requested_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_email = Column(String(255), nullable=True)  # Admin who reviewed the request
    review_notes = Column(Text, nullable=True)  # Admin notes about the decision
    
    # User agent and additional context
    user_agent = Column(String(512), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 can be up to 45 chars
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_beta_requests_email', 'email'),
        Index('idx_beta_requests_status', 'status'),
        Index('idx_beta_requests_requested_at', 'requested_at'),
        Index('idx_beta_requests_email_status', 'email', 'status'),
    )
    
    def __repr__(self):
        return f"<BetaAccessRequests(email='{self.email}', status='{self.status}', requested_at='{self.requested_at}')>"


class UserPreferences(Base):
    """Model for storing user shopping preferences and onboarding data."""
    __tablename__ = "user_preferences"
    
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, index=True, nullable=False)
    
    # Personal Shopping Profile
    household_size = Column(String(10), nullable=True)  # small, medium, large
    dietary_restrictions = Column(JSON, nullable=True, default=list)  # ["kosher", "vegan", "gluten-free"]
    budget_preference = Column(String(10), nullable=True)  # budget, moderate, premium
    primary_sites = Column(JSON, nullable=True, default=list)  # ["rami-levy", "shufersal"]
    shopping_frequency = Column(String(10), nullable=True)  # daily, weekly, monthly
    
    # Shopping Preferences
    language_preference = Column(String(5), default="en", nullable=False)  # en, he
    preferred_categories = Column(JSON, nullable=True, default=list)  # ["fresh-produce", "packaged-goods"]
    brand_preferences = Column(JSON, nullable=True, default=list)  # ["store-brands", "premium-brands"]
    special_considerations = Column(JSON, nullable=True, default=list)  # ["organic-preferred", "bulk-buying"]
    
    # Metadata
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    onboarding_completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to User
    user = relationship("User", back_populates="preferences")
    
    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_user_preferences_user_id', 'user_id'),
        Index('idx_user_preferences_onboarding', 'onboarding_completed'),
        Index('idx_user_preferences_updated', 'updated_at'),
    )
    
    def __repr__(self):
        return f"<UserPreferences(id={self.id}, user_id='{self.user_id}', onboarding_completed={self.onboarding_completed})>"


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        return db
    except Exception as e:
        db.close()
        raise e


def get_db_dependency():
    """FastAPI dependency for database session with connection health check."""
    from sqlalchemy import text
    db = SessionLocal()
    try:
        # Test the connection before yielding
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        db.rollback()
        raise
    finally:
        try:
            db.close()
        except Exception as e:
            logger.warning(f"Error closing database session: {e}")


def create_tables():
    """Create all database tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def cleanup_expired_tokens():
    """Clean up expired tokens from blacklist (call periodically)."""
    try:
        db = SessionLocal()
        now = datetime.now(timezone.utc)
        
        # Delete expired blacklisted tokens
        expired_count = db.query(TokenBlacklist).filter(
            TokenBlacklist.expires_at < now
        ).delete()
        
        # Mark expired sessions as inactive
        expired_sessions = db.query(UserSession).filter(
            UserSession.expires_at < now,
            UserSession.is_active == True
        ).update({
            "is_active": False,
            "logout_at": now,
            "logout_reason": "expired"
        })
        
        db.commit()
        db.close()
        
        if expired_count > 0 or expired_sessions > 0:
            logger.info(f"Cleanup: {expired_count} expired tokens, {expired_sessions} expired sessions")
            
    except Exception as e:
        logger.error(f"Error during token cleanup: {e}")


if __name__ == "__main__":
    # Create tables when run directly
    create_tables()