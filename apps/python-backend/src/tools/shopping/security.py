"""
Security validation utilities for shopping operations
Port of the TypeScript ShoppingSecurity class
"""

import re
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from .types import SiteAdapterName, PriceRange


class ValidationResult:
    """Result of a validation operation"""
    
    def __init__(self, is_valid: bool, sanitized: str = "", error: Optional[str] = None):
        self.is_valid = is_valid
        self.sanitized = sanitized
        self.error = error


class ShoppingSecurity:
    """Security validation utilities for shopping operations"""
    
    @staticmethod
    def validate_search_query(query: str) -> ValidationResult:
        """Validate and sanitize product search query"""
        if not query or not isinstance(query, str):
            return ValidationResult(False, "", "Search query is required")
        
        # Remove dangerous characters and limit length
        sanitized = (
            query
            .replace('<', '')    # Remove HTML brackets
            .replace('>', '')
            .replace('"', '')    # Remove quotes to prevent injection
            .replace("'", "")
            .replace('\\', '')   # Remove backslashes
            .strip()[:200]       # Limit to 200 characters
        )
        
        if not sanitized:
            return ValidationResult(False, "", "Search query cannot be empty after sanitization")
        
        if len(sanitized) < 2:
            return ValidationResult(False, sanitized, "Search query must be at least 2 characters")
        
        return ValidationResult(True, sanitized)
    
    @staticmethod
    def validate_product_id(product_id: str, website: SiteAdapterName) -> ValidationResult:
        """Validate product ID format"""
        if not product_id or not isinstance(product_id, str):
            return ValidationResult(False, error="Product ID is required")
        
        sanitized = product_id.strip()
        
        if not sanitized:
            return ValidationResult(False, error="Product ID cannot be empty")
        
        if len(sanitized) > 100:
            return ValidationResult(False, error="Product ID too long")
        
        # Only allow alphanumeric characters, hyphens, and underscores
        if not re.match(r'^[a-zA-Z0-9\-_]+$', sanitized):
            return ValidationResult(False, error="Product ID contains invalid characters")
        
        return ValidationResult(True, sanitized)
    
    @staticmethod
    def validate_quantity(quantity: int) -> ValidationResult:
        """Validate product quantity"""
        if not isinstance(quantity, int):
            return ValidationResult(False, error="Quantity must be a number")
        
        if quantity < 0:
            return ValidationResult(False, error="Quantity cannot be negative")
        
        if quantity > 999:
            return ValidationResult(False, error="Quantity too large (max 999)")
        
        return ValidationResult(True, str(quantity))
    
    @staticmethod
    def validate_cart_item_id(cart_item_id: str) -> ValidationResult:
        """Validate cart item ID"""
        if not cart_item_id or not isinstance(cart_item_id, str):
            return ValidationResult(False, error="Cart item ID is required")
        
        sanitized = cart_item_id.strip()
        
        if not sanitized:
            return ValidationResult(False, error="Cart item ID cannot be empty")
        
        if len(sanitized) > 100:
            return ValidationResult(False, error="Cart item ID too long")
        
        # Only allow alphanumeric characters, hyphens, and underscores
        if not re.match(r'^[a-zA-Z0-9\-_]+$', sanitized):
            return ValidationResult(False, error="Cart item ID contains invalid characters")
        
        return ValidationResult(True, sanitized)
    
    @staticmethod
    def validate_category(category: Optional[str]) -> ValidationResult:
        """Validate product category"""
        if category is None:
            return ValidationResult(True, "")
        
        if not isinstance(category, str):
            return ValidationResult(False, error="Category must be a string")
        
        sanitized = (
            category
            .replace('<', '')
            .replace('>', '')
            .replace('"', '')
            .replace("'", "")
            .strip()[:100]  # Limit to 100 characters
        )
        
        return ValidationResult(True, sanitized)
    
    @staticmethod
    def validate_price_range(price_range: Optional[PriceRange]) -> ValidationResult:
        """Validate price range parameters"""
        if price_range is None:
            return ValidationResult(True, "")
        
        if not isinstance(price_range.min, (int, float)) or not isinstance(price_range.max, (int, float)):
            return ValidationResult(False, error="Price range values must be numbers")
        
        if price_range.min < 0 or price_range.max < 0:
            return ValidationResult(False, error="Price range values cannot be negative")
        
        if price_range.min >= price_range.max:
            return ValidationResult(False, error="Minimum price must be less than maximum price")
        
        if price_range.max > 100000:
            return ValidationResult(False, error="Maximum price too high")
        
        return ValidationResult(True, "")
    
    @staticmethod
    def validate_variant(variant: Optional[str]) -> ValidationResult:
        """Validate product variant"""
        if variant is None:
            return ValidationResult(True, "")
        
        if not isinstance(variant, str):
            return ValidationResult(False, error="Variant must be a string")
        
        sanitized = (
            variant
            .replace('<', '')
            .replace('>', '')
            .replace('"', '')
            .replace("'", "")
            .strip()[:200]  # Limit to 200 characters
        )
        
        return ValidationResult(True, sanitized)
    
    @staticmethod
    def format_secure_error(error: str) -> str:
        """Format error messages to avoid exposing sensitive information"""
        # Remove potential API keys, tokens, or sensitive data
        sanitized_error = re.sub(r'[a-zA-Z0-9]{20,}', '[REDACTED]', str(error))
        
        # Remove common sensitive patterns
        patterns = [
            r'api[_-]?key[:\s=]+[^\s]+',
            r'token[:\s=]+[^\s]+',
            r'password[:\s=]+[^\s]+',
            r'secret[:\s=]+[^\s]+',
            r'cookie[:\s=]+[^\s]+',
        ]
        
        for pattern in patterns:
            sanitized_error = re.sub(pattern, '[REDACTED]', sanitized_error, flags=re.IGNORECASE)
        
        return sanitized_error
    
    @staticmethod
    def sanitize_url(url: Optional[str]) -> Optional[str]:
        """Sanitize URLs to prevent injection attacks"""
        if not url:
            return None
        
        try:
            parsed = urlparse(url)
            # Only allow http/https protocols
            if parsed.scheme not in ('http', 'https'):
                return None
            return parsed.geturl()
        except Exception:
            return None