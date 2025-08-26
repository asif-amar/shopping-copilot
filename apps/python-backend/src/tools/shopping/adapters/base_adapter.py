"""
Abstract base class for shopping website adapters
Port of the TypeScript BaseShoppingAdapter class
"""

from abc import ABC, abstractmethod
from typing import Optional, Union
import re
from urllib.parse import urlparse

from ..constants import SiteAdapterName
from ..types import (
    Product, ProductSearchOptions, ShoppingOperationResult, WebsiteConfig, CredentialsType
)
from ..security import ShoppingSecurity


class BaseShoppingAdapter(ABC):
    """Abstract base class for shopping website adapters"""
    
    def __init__(self, website: SiteAdapterName, config: WebsiteConfig):
        self.website = website
        self.config = config
    
    @abstractmethod
    async def search_products(
        self,
        options: ProductSearchOptions,
        credentials: CredentialsType
    ) -> ShoppingOperationResult:
        """Search for products on the website"""
        pass
    
    @abstractmethod
    async def add_to_cart(
        self,
        product_id: str,
        quantity: int,
        credentials: CredentialsType,
        variant: Optional[str] = None
    ) -> ShoppingOperationResult:
        """Add a product to the shopping cart"""
        pass
    
    @abstractmethod
    async def remove_from_cart(
        self,
        cart_item_id: str,
        credentials: CredentialsType
    ) -> ShoppingOperationResult:
        """Remove an item from the shopping cart"""
        pass
    
    @abstractmethod
    async def update_cart_quantity(
        self,
        cart_item_id: str,
        quantity: int,
        credentials: CredentialsType
    ) -> ShoppingOperationResult:
        """Update quantity of an item in the cart"""
        pass
    
    @abstractmethod
    async def get_cart_contents(self, credentials: CredentialsType) -> ShoppingOperationResult:
        """Get current cart contents"""
        pass
    
    def validate_config(self) -> bool:
        """Validate that the adapter is properly configured"""
        if not self.config:
            return False
        
        # Note: Authentication validation is done per-method call
        # since credentials are passed as parameters, not stored in the adapter
        return True
    
    def get_website_name(self) -> SiteAdapterName:
        """Get website name for identification"""
        return self.website
    
    def get_rate_limit(self) -> int:
        """Get rate limit information"""
        return self.config.rate_limit_per_minute
    
    def create_error_result(self, error: str) -> ShoppingOperationResult:
        """Create standardized error result"""
        return ShoppingOperationResult(
            success=False,
            error=ShoppingSecurity.format_secure_error(error),
            website=self.website.value
        )
    
    def create_success_result(self, data) -> ShoppingOperationResult:
        """Create standardized success result"""
        return ShoppingOperationResult(
            success=True,
            data=data,
            website=self.website.value
        )
    
    def sanitize_product(self, product_data: dict) -> Product:
        """Sanitize product data to remove potential security issues"""
        return Product(
            id=str(product_data.get('id', '')).replace('<', '').replace('>', '')[:100],
            title=str(product_data.get('title', '')).replace('<', '').replace('>', '')[:200],
            description=str(product_data.get('description', '')).replace('<', '').replace('>', '')[:1000],
            price=float(product_data.get('price', 0)) if product_data.get('price') is not None else 0.0,
            currency=str(product_data.get('currency', 'ILS'))[:3],
            image_url=self._sanitize_url(product_data.get('image_url')),
            availability=bool(product_data.get('availability', True)),
            rating=self._sanitize_rating(product_data.get('rating')),
            review_count=max(int(product_data.get('review_count', 0)), 0) if product_data.get('review_count') is not None else None,
            category=str(product_data.get('category', '')).replace('<', '').replace('>', '')[:100] if product_data.get('category') else None,
            brand=str(product_data.get('brand', '')).replace('<', '').replace('>', '')[:100] if product_data.get('brand') else None,
            # barcode=str(product_data.get('barcode', '')).replace('<', '').replace('>', '')[:100] if product_data.get('barcode') else None,
            url=self._sanitize_url(product_data.get('url'))
        )
    
    def _sanitize_url(self, url: Optional[str]) -> Optional[str]:
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
    
    def _sanitize_rating(self, rating) -> Optional[float]:
        """Sanitize rating value"""
        if rating is None:
            return None
        try:
            rating_float = float(rating)
            return max(0.0, min(5.0, rating_float))
        except (ValueError, TypeError):
            return None