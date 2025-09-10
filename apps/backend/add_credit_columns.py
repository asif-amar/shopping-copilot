#!/usr/bin/env python3
"""
Database migration script to add credit system columns to the users table.

This script safely adds the new credit-related columns to the existing users table
and initializes all existing users with default credit values.

Usage:
    python add_credit_columns.py
"""

import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text, Column, Integer, String, DateTime
from sqlalchemy.exc import OperationalError, ProgrammingError

# Add the parent directory to the path to import our modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.config import config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def calculate_next_reset_date() -> datetime:
    """Calculate the next monthly reset date by adding 1 month to current date."""
    now = datetime.now(timezone.utc)
    # Add 1 month to the current date
    if now.month == 12:
        next_reset = now.replace(year=now.year + 1, month=1)
    else:
        next_reset = now.replace(month=now.month + 1)
    return next_reset

def add_credit_columns():
    """Add credit system columns to the users table."""
    
    if not config.DATABASE_URL:
        logger.error("DATABASE_URL not set in environment variables")
        return False
    
    engine = create_engine(config.DATABASE_URL)
    
    # List of columns to add
    columns_to_add = [
        {
            'name': 'credits_remaining',
            'definition': 'INTEGER NOT NULL DEFAULT 50',
            'description': 'Current remaining credits for the user'
        },
        {
            'name': 'credits_total_monthly',
            'definition': 'INTEGER NOT NULL DEFAULT 50', 
            'description': 'Total monthly credit allowance'
        },
        {
            'name': 'credits_reset_date',
            'definition': 'TIMESTAMP WITH TIME ZONE',
            'description': 'Date when credits will next reset'
        },
        {
            'name': 'plan_type',
            'definition': 'VARCHAR(20) NOT NULL DEFAULT \'free\'',
            'description': 'User plan type (free, premium, etc.)'
        }
    ]
    
    try:
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            
            try:
                # Check if users table exists
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'users'
                    );
                """))
                
                if not result.fetchone()[0]:
                    logger.error("Users table does not exist. Please run the main application first to create tables.")
                    return False
                
                # Check which columns already exist
                existing_columns = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                """)).fetchall()
                
                existing_column_names = {row[0] for row in existing_columns}
                logger.info(f"Found existing columns: {existing_column_names}")
                
                # Add missing columns
                columns_added = []
                for column in columns_to_add:
                    if column['name'] not in existing_column_names:
                        logger.info(f"Adding column: {column['name']}")
                        conn.execute(text(f"""
                            ALTER TABLE users 
                            ADD COLUMN {column['name']} {column['definition']}
                        """))
                        columns_added.append(column['name'])
                        logger.info(f"✓ Added column: {column['name']}")
                    else:
                        logger.info(f"Column {column['name']} already exists, skipping")
                
                # Initialize credits_reset_date for existing users if the column was just added
                if 'credits_reset_date' in columns_added:
                    next_reset = calculate_next_reset_date()
                    logger.info(f"Setting credits_reset_date to {next_reset} for existing users")
                    
                    result = conn.execute(text("""
                        UPDATE users 
                        SET credits_reset_date = :reset_date 
                        WHERE credits_reset_date IS NULL
                    """), {"reset_date": next_reset})
                    
                    updated_count = result.rowcount
                    logger.info(f"Updated {updated_count} users with reset date")
                
                # Commit the transaction
                trans.commit()
                
                if columns_added:
                    logger.info(f"✅ Successfully added {len(columns_added)} new columns to users table: {', '.join(columns_added)}")
                else:
                    logger.info("✅ All credit columns already exist in users table")
                
                # Verify the changes
                updated_columns = conn.execute(text("""
                    SELECT column_name, data_type, column_default
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                    AND column_name IN ('credits_remaining', 'credits_total_monthly', 'credits_reset_date', 'plan_type')
                    ORDER BY column_name
                """)).fetchall()
                
                logger.info("Credit columns in users table:")
                for col_name, data_type, default_val in updated_columns:
                    logger.info(f"  - {col_name}: {data_type} (default: {default_val})")
                
                return True
                
            except Exception as e:
                trans.rollback()
                logger.error(f"Error during migration, rolled back: {e}")
                return False
                
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        return False

def verify_migration():
    """Verify that the migration was successful."""
    engine = create_engine(config.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if all credit columns exist
            result = conn.execute(text("""
                SELECT COUNT(*) as credit_columns
                FROM information_schema.columns 
                WHERE table_name = 'users'
                AND column_name IN ('credits_remaining', 'credits_total_monthly', 'credits_reset_date', 'plan_type')
            """)).fetchone()
            
            if result[0] == 4:
                logger.info("✅ Migration verification successful: All 4 credit columns exist")
                
                # Show a sample of user data
                users = conn.execute(text("""
                    SELECT email, credits_remaining, credits_total_monthly, plan_type, credits_reset_date
                    FROM users 
                    LIMIT 5
                """)).fetchall()
                
                if users:
                    logger.info("Sample user data:")
                    for user in users:
                        logger.info(f"  - {user[0]}: {user[1]}/{user[2]} credits, {user[3]} plan, reset: {user[4]}")
                else:
                    logger.info("No users found in database")
                    
                return True
            else:
                logger.error(f"Migration verification failed: Only {result[0]} credit columns found (expected 4)")
                return False
                
    except Exception as e:
        logger.error(f"Migration verification failed: {e}")
        return False

def main():
    """Main migration function."""
    logger.info("🚀 Starting credit system database migration...")
    
    try:
        # Validate configuration
        config.validate_required_env_vars()
        logger.info("✓ Configuration validated")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return False
    
    # Add credit columns
    if not add_credit_columns():
        logger.error("❌ Migration failed")
        return False
    
    # Verify migration
    if not verify_migration():
        logger.error("❌ Migration verification failed")
        return False
    
    logger.info("🎉 Credit system migration completed successfully!")
    logger.info("You can now start using the credit system features.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)