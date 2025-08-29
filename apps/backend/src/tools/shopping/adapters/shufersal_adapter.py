"""
Shufersal shopping adapter implementation
Port of the TypeScript ShufersalAdapter class
"""

import logging
from typing import Dict, Any, Optional, List

from .base_adapter import BaseShoppingAdapter
from ..constants import SiteAdapterName
from ..types import (
    WebsiteConfig, ProductSearchOptions, ProductSearchResult,
    ShoppingOperationResult, CartItem, Cart, ShufersalCredentials
)
from ..api_client import ApiClient


logger = logging.getLogger(__name__)


class ShufersalAdapter(BaseShoppingAdapter):
    """Shufersal shopping adapter implementation"""
    
    def __init__(self):
        config = WebsiteConfig(
            name="Shufersal",
            base_url="https://www.shufersal.co.il/online/he",
            api_version="v1",
            rate_limit_per_minute=60,
            requires_auth=True
        )
        
        super().__init__(SiteAdapterName.SHUFERSAL, config)
        
        # Base headers for API requests
        self.base_headers = {
            "accept": "application/json",
            "x-requested-with": "XMLHttpRequest",
            "referer": "https://www.shufersal.co.il/online/he/",
            "content-type": "application/json"
        }
        
        self.api_client = None
    
    async def _ensure_client(self):
        """Ensure API client is initialized"""
        if not self.api_client:
            self.api_client = ApiClient(self.config.base_url, self.base_headers)
    
    def _create_auth_headers(self, credentials: ShufersalCredentials) -> Dict[str, str]:
        """Create authentication headers using dynamic credential mapping"""
        # Import here to avoid circular import
        from ..credential_manager import CredentialManager
        
        return CredentialManager.create_api_headers(
            site=self.website,
            credentials=credentials,
            base_headers=self.base_headers
        )
    
    def _extract_price(self, item: Dict[str, Any]) -> float:
        """Extract price from Shufersal item data"""
        # Try different price fields
        price_sources = [
            item.get('effectivePrice'),
            item.get('price', {}).get('value') if isinstance(item.get('price'), dict) else item.get('price'),
            item.get('categoryPrice', {}).get('value'),
            item.get('pricePerUnit', {}).get('value')
        ]
        
        for price in price_sources:
            if price is not None and price > 0:
                return float(price)
        
        return 0.0
    
    def _get_image_url(self, item: Dict[str, Any]) -> Optional[str]:
        """Extract image URL from Shufersal item data"""
        # Try different image fields
        image_sources = [
            item.get('baseProductImageMedium'),
            item.get('baseProductImageSmall'),
            item.get('baseProductImageLarge')
        ]
        
        for image_url in image_sources:
            if image_url:
                # Make sure it's a full URL
                if image_url.startswith('http'):
                    return image_url
                else:
                    return f"https://www.shufersal.co.il{image_url}"
        
        # Try images array
        images = item.get('images', [])
        if images and len(images) > 0:
            first_image = images[0]
            if isinstance(first_image, dict) and first_image.get('url'):
                url = first_image['url']
                if url.startswith('http'):
                    return url
                else:
                    return f"https://www.shufersal.co.il{url}"
        
        return None
    
    def _get_availability(self, item: Dict[str, Any]) -> bool:
        """Extract availability from Shufersal item data"""
        stock = item.get('stock', {})
        if isinstance(stock, dict):
            status = stock.get('stockLevelStatus', {})
            if isinstance(status, dict):
                code = status.get('code', '').lower()
                return code in ['instock', 'available']
        
        # If no clear stock info, assume available
        return True
    
    async def search_products(
        self,
        options: ProductSearchOptions,
        credentials: ShufersalCredentials
    ) -> ShoppingOperationResult:
        """Search for products on Shufersal"""
        try:
            await self._ensure_client()
            
            logger.info(f"Searching Shufersal for: '{options.query}'")
            
            # Shufersal search endpoint
            params = {
                'q': options.query,
                'pageSize': 20,
                'currentPage': 0,
                'sort': 'relevance'
            }
            
            if options.category:
                params['category'] = options.category
            
            response = await self.api_client.get(
                "/search",
                params=params,
                headers=self._create_auth_headers(credentials)
            )
            
            # Extract products from response
            results = response.get('results', [])
            if not results:
                # Sometimes results are nested differently
                results = response.get('products', [])
            
            products = []
            for item in results:
                # Debug: Log brand information
                brand_name = item.get('brandName')
                logger.info(f"Product: {item.get('name', '')}, Brand: {brand_name}")
                
                product_data = {
                    'id': str(item.get('code', '')),
                    'title': item.get('name', ''),
                    'description': item.get('name', ''),  # Shufersal doesn't have separate description
                    'price': self._extract_price(item),
                    'currency': 'ILS',
                    'image_url': self._get_image_url(item),
                    'availability': self._get_availability(item),
                    'category': item.get('secondLevelCategory'),
                    'brand': brand_name,
                    'url': f"https://www.shufersal.co.il{item.get('url', '')}" if item.get('url') else None,
                    'rating': item.get('averageRating'),
                    'review_count': item.get('numberOfReviews')
                }
                
                products.append(self.sanitize_product(product_data))
            
            result = ProductSearchResult(
                products=products,
                total_count=len(products),
                website=self.website.value
            )
            
            return self.create_success_result(result)
            
        except Exception as e:
            logger.error(f"Shufersal search error: {e}")
            return self.create_error_result(f"Search failed: {str(e)}")
    
    async def add_to_cart(
        self,
        product_id: str,
        quantity: int,
        credentials: ShufersalCredentials,
        variant: Optional[str] = None
    ) -> ShoppingOperationResult:
        """Add a product to the shopping cart"""
        try:
            await self._ensure_client()
            
            # Shufersal add to cart endpoint
            payload = {
                'productCode': product_id,
                'qty': quantity
            }
            
            if variant:
                payload['variant'] = variant
            
            response = await self.api_client.post(
                "/cart/add",
                json_data=payload,
                headers=self._create_auth_headers(credentials)
            )
            
            # Shufersal may return HTML or JSON
            if isinstance(response, dict) and response.get('success'):
                cart_item = CartItem(
                    id=f"shufersal_{product_id}",
                    product_id=product_id,
                    product_title=f"Product {product_id}",
                    quantity=quantity,
                    variant=variant
                )
                return self.create_success_result(cart_item)
            else:
                return self.create_success_result(f"Added {quantity} of product {product_id} to cart")
            
        except Exception as e:
            logger.error(f"Shufersal add to cart error: {e}")
            return self.create_error_result(f"Failed to add to cart: {str(e)}")
    
    async def remove_from_cart(
        self,
        cart_item_id: str,
        credentials: ShufersalCredentials
    ) -> ShoppingOperationResult:
        """Remove an item from the shopping cart"""
        try:
            await self._ensure_client()
            
            # Extract product code from cart item ID
            product_code = cart_item_id.replace("shufersal_", "")
            
            payload = {
                'productCode': product_code
            }
            
            response = await self.api_client.post(
                "/cart/remove",
                json_data=payload,
                headers=self._create_auth_headers(credentials)
            )
            
            return self.create_success_result(True)
            
        except Exception as e:
            logger.error(f"Shufersal remove from cart error: {e}")
            return self.create_error_result(f"Failed to remove from cart: {str(e)}")
    
    async def update_cart_quantity(
        self,
        cart_item_id: str,
        quantity: int,
        credentials: ShufersalCredentials
    ) -> ShoppingOperationResult:
        """Update quantity of an item in the cart"""
        try:
            await self._ensure_client()
            
            # Extract product code from cart item ID
            product_code = cart_item_id.replace("shufersal_", "")
            
            if quantity == 0:
                # Remove item if quantity is 0
                return await self.remove_from_cart(cart_item_id, credentials)
            
            payload = {
                'productCode': product_code,
                'qty': quantity
            }
            
            response = await self.api_client.post(
                "/cart/update",
                json_data=payload,
                headers=self._create_auth_headers(credentials)
            )
            
            cart_item = CartItem(
                id=cart_item_id,
                product_id=product_code,
                product_title=f"Product {product_code}",
                quantity=quantity
            )
            
            return self.create_success_result(cart_item)
            
        except Exception as e:
            logger.error(f"Shufersal update cart quantity error: {e}")
            return self.create_error_result(f"Failed to update cart quantity: {str(e)}")
    
    async def get_cart_contents(self, credentials: ShufersalCredentials) -> ShoppingOperationResult:
        """Get current cart contents"""
        try:
            await self._ensure_client()
            
            response = await self.api_client.get(
                "/cart",
                headers=self._create_auth_headers(credentials)
            )
            
            cart_items = []
            total_items = 0
            total_price = 0.0
            
            # Parse cart data
            entries = response.get('entries', [])
            
            for entry in entries:
                quantity = entry.get('quantity', entry.get('cartyQty', 0))
                unit_price = self._extract_price(entry)
                
                cart_item = CartItem(
                    id=f"shufersal_{entry.get('productCode', entry.get('code', ''))}",
                    product_id=str(entry.get('productCode', entry.get('code', ''))),
                    product_title=entry.get('productName', entry.get('name', 'Unknown Product')),
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=unit_price * quantity
                )
                
                cart_items.append(cart_item)
                total_items += quantity
                total_price += cart_item.total_price or 0
            
            cart = Cart(
                items=cart_items,
                total_items=total_items,
                total_price=total_price,
                currency="ILS",
                website=self.website.value
            )
            
            return self.create_success_result(cart)
            
        except Exception as e:
            logger.error(f"Shufersal get cart contents error: {e}")
            return self.create_error_result(f"Failed to get cart contents: {str(e)}")
    
    async def close(self):
        """Close API client"""
        if self.api_client:
            await self.api_client.close()