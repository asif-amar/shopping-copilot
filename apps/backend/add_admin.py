#!/usr/bin/env python3
"""Script to add the admin email to the allowed_users table."""

import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Now import our modules
from src.database import SessionLocal, AllowedUsers

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_admin_email():
    """Add admin email to allowed users table."""
    admin_email = "liorlivyatan@gmail.com"  # TODO: Replace with your email
    
    db = SessionLocal()
    try:
        # Check if admin email already exists
        existing = db.query(AllowedUsers).filter(
            AllowedUsers.email == admin_email.lower()
        ).first()
        
        if existing:
            if not existing.is_active:
                existing.is_active = True
                db.commit()
                logger.info(f"Reactivated admin email: {admin_email}")
            else:
                logger.info(f"Admin email already exists and is active: {admin_email}")
        else:
            # Add new admin user
            admin_user = AllowedUsers(
                email=admin_email.lower(),
                added_by_email="system",
                notes="System administrator - initial setup",
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            logger.info(f"Added admin email to whitelist: {admin_email}")
            
    except Exception as e:
        logger.error(f"Error adding admin email: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_admin_email()
    print("Admin email setup complete!")