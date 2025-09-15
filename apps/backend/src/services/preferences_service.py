"""Preferences service for managing user onboarding and preferences."""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from ..database import UserPreferences, User

logger = logging.getLogger(__name__)


class PreferencesService:
    """Service for user preferences and onboarding operations."""
    
    @staticmethod
    def get_user_preferences(db: Session, user_id: str) -> Optional[UserPreferences]:
        """Get user preferences by user ID."""
        try:
            return db.query(UserPreferences).filter(
                UserPreferences.user_id == user_id
            ).first()
        except Exception as e:
            logger.error(f"Error getting user preferences for {user_id}: {e}")
            return None
    
    @staticmethod
    def create_default_preferences(db: Session, user_id: str) -> UserPreferences:
        """Create default preferences for a new user."""
        try:
            preferences = UserPreferences(
                user_id=user_id,
                language_preference="en",
                dietary_restrictions=[],
                primary_sites=[],
                preferred_categories=[],
                brand_preferences=[],
                special_considerations=[],
                onboarding_completed=False
            )
            
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
            
            logger.info(f"Created default preferences for user {user_id}")
            return preferences
            
        except IntegrityError:
            db.rollback()
            # Preferences might already exist, return existing
            existing = db.query(UserPreferences).filter(
                UserPreferences.user_id == user_id
            ).first()
            if existing:
                return existing
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating default preferences for user {user_id}: {e}")
            raise
    
    @staticmethod
    def get_or_create_preferences(db: Session, user_id: str) -> UserPreferences:
        """Get existing preferences or create default ones."""
        preferences = PreferencesService.get_user_preferences(db, user_id)
        if not preferences:
            preferences = PreferencesService.create_default_preferences(db, user_id)
        return preferences
    
    @staticmethod
    def update_preferences(
        db: Session,
        user_id: str,
        preferences_data: Dict[str, Any]
    ) -> Optional[UserPreferences]:
        """Update user preferences with provided data."""
        try:
            preferences = PreferencesService.get_or_create_preferences(db, user_id)
            
            # Track if any changes were made
            changes_made = False
            
            # Update fields if provided
            updatable_fields = [
                'household_size', 'dietary_restrictions', 'budget_preference',
                'primary_sites', 'shopping_frequency', 'language_preference',
                'preferred_categories', 'brand_preferences', 'special_considerations'
            ]
            
            for field in updatable_fields:
                if field in preferences_data:
                    new_value = preferences_data[field]
                    current_value = getattr(preferences, field)
                    
                    if new_value != current_value:
                        setattr(preferences, field, new_value)
                        changes_made = True
                        logger.info(f"Updated {field} for user {user_id}")
            
            # Handle onboarding completion
            if 'onboarding_completed' in preferences_data and preferences_data['onboarding_completed']:
                if not preferences.onboarding_completed:
                    preferences.onboarding_completed = True
                    preferences.onboarding_completed_at = datetime.now(timezone.utc)
                    changes_made = True
                    logger.info(f"Marked onboarding as completed for user {user_id}")
            
            # Only commit if changes were made
            if changes_made:
                db.commit()
                db.refresh(preferences)
                logger.info(f"User preferences updated successfully for user {user_id}")
            
            return preferences
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating preferences for user {user_id}: {e}")
            raise
    
    @staticmethod
    def complete_onboarding(
        db: Session,
        user_id: str,
        onboarding_data: Dict[str, Any]
    ) -> UserPreferences:
        """Complete user onboarding with collected data."""
        try:
            # Ensure onboarding_completed is set to True
            onboarding_data['onboarding_completed'] = True
            
            preferences = PreferencesService.update_preferences(
                db, user_id, onboarding_data
            )
            
            logger.info(f"Onboarding completed for user {user_id}")
            return preferences
            
        except Exception as e:
            logger.error(f"Error completing onboarding for user {user_id}: {e}")
            raise
    
    @staticmethod
    def get_preferences_for_ai_context(db: Session, user_id: str) -> Dict[str, Any]:
        """Get user preferences formatted for AI context."""
        try:
            preferences = PreferencesService.get_user_preferences(db, user_id)
            
            if not preferences:
                # Return default context for users without preferences
                return {
                    'language': 'en',
                    'dietary_restrictions': [],
                    'budget_preference': 'moderate',
                    'household_size': 'medium',
                    'onboarding_completed': False
                }
            
            return {
                'language': preferences.language_preference,
                'dietary_restrictions': preferences.dietary_restrictions or [],
                'budget_preference': preferences.budget_preference or 'moderate',
                'household_size': preferences.household_size or 'medium',
                'shopping_frequency': preferences.shopping_frequency or 'weekly',
                'primary_sites': preferences.primary_sites or [],
                'preferred_categories': preferences.preferred_categories or [],
                'brand_preferences': preferences.brand_preferences or [],
                'special_considerations': preferences.special_considerations or [],
                'onboarding_completed': preferences.onboarding_completed
            }
            
        except Exception as e:
            logger.error(f"Error getting AI context for user {user_id}: {e}")
            # Return safe defaults on error
            return {
                'language': 'en',
                'dietary_restrictions': [],
                'budget_preference': 'moderate',
                'household_size': 'medium',
                'onboarding_completed': False
            }
    
    @staticmethod
    def get_onboarding_stats(db: Session) -> Dict[str, Any]:
        """Get onboarding completion statistics for analytics."""
        try:
            total_users = db.query(User).count()
            
            completed_onboarding = db.query(UserPreferences).filter(
                UserPreferences.onboarding_completed == True
            ).count()
            
            completion_rate = (completed_onboarding / total_users * 100) if total_users > 0 else 0
            
            return {
                'total_users': total_users,
                'completed_onboarding': completed_onboarding,
                'completion_rate': round(completion_rate, 2),
                'pending_onboarding': total_users - completed_onboarding
            }
            
        except Exception as e:
            logger.error(f"Error getting onboarding stats: {e}")
            return {
                'total_users': 0,
                'completed_onboarding': 0,
                'completion_rate': 0,
                'pending_onboarding': 0
            }