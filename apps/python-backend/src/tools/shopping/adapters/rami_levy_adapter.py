"""
Rami Levy shopping adapter implementation
Port of the TypeScript RamiLevyAdapter class
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from .base_adapter import BaseShoppingAdapter
from ..constants import SiteAdapterName
from ..types import (
    WebsiteConfig, ProductSearchOptions, ProductSearchResult,
    ShoppingOperationResult, CartItem, Cart, RamiLevyCredentials
)
from ..api_client import ApiClient


logger = logging.getLogger(__name__)


class RamiLevySaleData:
    """Represents sale information for a product"""
    def __init__(self, data: Dict[str, Any]):
        self.code = data.get('code', 0)
        self.cmt = data.get('cmt', 0)  # quantity needed for discount
        self.scm = data.get('scm', 0)  # total price for discount quantity
        self.label = data.get('label', '')
        self.name = data.get('name', '')
        self.from_date = data.get('from', '')
        self.to_date = data.get('to', '')
        self.is_club = data.get('is_club', 0)  # 1 if club members only
        self.active = data.get('active', 0)
        self.max_in_doc = data.get('max_in_doc')  # maximum quantity that can get discount


class RamiLevyAdapter(BaseShoppingAdapter):
    """Rami Levy shopping adapter implementation"""
    
    def __init__(self):
        config = WebsiteConfig(
            name="Rami Levy",
            base_url="https://www.rami-levy.co.il/api",
            api_version="v2",
            rate_limit_per_minute=60,
            requires_auth=True,
            auth_type="api_key"
        )
        
        super().__init__(SiteAdapterName.RAMI_LEVY, config)
        
        # Configuration values - could be made configurable via environment
        self.store = "331"  # Default store
        
        # Base headers for API requests
        self.base_headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "locale": "he",
            "origin": "https://www.rami-levy.co.il",
            "referer": "https://www.rami-levy.co.il/he/online/search"
        }
        
        self.api_client = None
        self.user_api_client = None
    
    async def _ensure_clients(self):
        """Ensure API clients are initialized"""
        if not self.api_client:
            self.api_client = ApiClient(self.config.base_url, self.base_headers)
        if not self.user_api_client:
            self.user_api_client = ApiClient(
                "https://www-api.rami-levy.co.il/api",
                self.base_headers
            )
    
    def _create_auth_headers(self, credentials: RamiLevyCredentials) -> Dict[str, str]:
        """Create authentication headers using dynamic credential mapping"""
        # Import here to avoid circular import
        from ..credential_manager import CredentialManager
        
        return CredentialManager.create_api_headers(
            site=self.website,
            credentials=credentials,
            base_headers=self.base_headers
        )
    
    def _calculate_best_price(self, product_data: Dict[str, Any], quantity: int) -> Dict[str, Any]:
        """Calculate the best price considering sales and quantity"""
        regular_price = product_data.get('price', {}).get('price', 0)
        regular_total = regular_price * quantity
        
        sales_data = product_data.get('sale', [])
        if not sales_data or quantity == 0:
            return {
                'unit_price': regular_price,
                'total_price': regular_total
            }
        
        # Filter active sales
        applicable_sales = []
        for sale_data in sales_data:
            sale = RamiLevySaleData(sale_data)
            if (sale.active == 1 and sale.cmt > 0 and sale.scm > 0 and 
                quantity >= sale.cmt):
                applicable_sales.append(sale)
        
        if not applicable_sales:
            return {
                'unit_price': regular_price,
                'total_price': regular_total
            }
        
        # Find the best sale
        best_sale = None
        best_total_price = regular_total
        
        for sale in applicable_sales:
            if sale.max_in_doc and sale.max_in_doc > 0:
                # Handle max_in_doc logic
                discounted_qty = min(quantity, sale.max_in_doc)
                regular_qty = quantity - discounted_qty
                
                sale_units = discounted_qty // sale.cmt
                remaining_discounted_items = discounted_qty % sale.cmt
                
                sale_total = (
                    sale_units * sale.scm + 
                    remaining_discounted_items * regular_price + 
                    regular_qty * regular_price
                )
            else:
                # Original logic: no max_in_doc limit
                sale_units = quantity // sale.cmt
                remaining_items = quantity % sale.cmt
                sale_total = sale_units * sale.scm + remaining_items * regular_price
            
            if sale_total < best_total_price:
                best_total_price = sale_total
                best_sale = sale
        
        if best_sale:
            savings = regular_total - best_total_price
            club_note = " (Club members only)" if best_sale.is_club == 1 else ""
            max_note = (f" (Max {best_sale.max_in_doc} items on sale)" 
                       if best_sale.max_in_doc and best_sale.max_in_doc > 0 else "")
            
            return {
                'unit_price': best_total_price / quantity,
                'total_price': best_total_price,
                'sale_info': f"💰 Sale: {best_sale.cmt} for {best_sale.scm} ILS (Save {savings:.2f} ILS){club_note}{max_note}"
            }
        
        return {
            'unit_price': regular_price,
            'total_price': regular_total
        }
    
    async def search_products(
        self,
        options: ProductSearchOptions,
        credentials: RamiLevyCredentials
    ) -> ShoppingOperationResult:
        """Search for products on Rami Levy"""
        try:
            await self._ensure_clients()
            
            logger.info(f"Searching Rami Levy for: '{options.query}'")
            
            payload = {
                "q": options.query,
                "store": self.store,
                "aggs": 1
            }
            
            response = await self.api_client.post(
                "/catalog",
                json_data=payload,
                headers=self._create_auth_headers(credentials)
            )
            
            if response.get('status') != 200:
                return self.create_error_result("Search request failed")
            
            # Transform products
            products = []
            raw_products = response.get('data', [])
            
            for item in raw_products:
                # Extract image URL
                image_url = None
                main_image = item.get('mainImage')
                if main_image and isinstance(main_image, str) and main_image.strip():
                    image_url = f"https://img.rami-levy.co.il{main_image}"
                else:
                    images_dict = item.get('images', {})
                    if isinstance(images_dict, dict) and images_dict.get('small'):
                        image_url = f"https://img.rami-levy.co.il{images_dict.get('small')}"
                
                product_data = {
                    'id': str(item.get('id', '')),
                    'title': item.get('name', ''),
                    'description': item.get('name', ''),  # Rami Levy doesn't have separate description
                    'price': item.get('price', {}).get('price', 0),
                    'currency': 'ILS',
                    'image_url': image_url,
                    'availability': len(item.get('available_in', [])) > 0,
                    'category': item.get('department', {}).get('name'),
                    'brand': item.get('gs', {}).get('BrandName'),
                    'url': f"https://www.rami-levy.co.il/he/online/search?item={item.get('barcode', '')}"
                }
                
                products.append(self.sanitize_product(product_data))
            
            result = ProductSearchResult(
                products=products,
                total_count=response.get('total', len(products)),
                website=self.website.value
            )
            
            return self.create_success_result(result)
            
        except Exception as e:
            logger.error(f"Rami Levy search error: {e}")
            return self.create_error_result(f"Search failed: {str(e)}")
    
    async def _get_current_cart(self, credentials: RamiLevyCredentials) -> Dict[str, int]:
        """Get current cart contents as product_id -> quantity mapping"""
        try:
            await self._ensure_clients()
            
            response = await self.user_api_client.get(
                f"/users/{credentials.user_id}/cart",
                headers=self._create_auth_headers(credentials)
            )
            
            cart_data = response.get('cart', {})
            return cart_data.get('items', {})
            
        except Exception as e:
            logger.error(f"Failed to get current cart: {e}")
            return {}
    
    async def _update_cart(self, items: Dict[str, int], credentials: RamiLevyCredentials) -> bool:
        """Update the entire cart with new items and quantities"""
        try:
            await self._ensure_clients()
            
            # Create tomorrow's date for supply
            tomorrow = datetime.now() + timedelta(days=1)
            
            payload = {
                "store": self.store,
                "isClub": 0,
                "supplyAt": tomorrow.isoformat(),
                "items": {str(k): str(v) for k, v in items.items()},
                "meta": None
            }
            
            await self.api_client.post(
                "/v2/cart",
                json_data=payload,
                headers=self._create_auth_headers(credentials)
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update cart: {e}")
            return False
    
    async def add_to_cart(
        self,
        product_id: str,
        quantity: int,
        credentials: RamiLevyCredentials,
        variant: Optional[str] = None
    ) -> ShoppingOperationResult:
        """Add a product to the shopping cart"""
        try:
            current_cart = await self._get_current_cart(credentials)
            current_quantity = current_cart.get(product_id, 0)
            new_quantity = current_quantity + quantity
            
            # Update cart
            current_cart[product_id] = new_quantity
            success = await self._update_cart(current_cart, credentials)
            
            if not success:
                return self.create_error_result("Failed to add item to cart")
            
            # Create cart item response
            cart_item = CartItem(
                id=f"cart_{product_id}",
                product_id=product_id,
                product_title=f"Product {product_id}",
                quantity=new_quantity,
                variant=variant
            )
            
            return self.create_success_result(cart_item)
            
        except Exception as e:
            logger.error(f"Add to cart error: {e}")
            return self.create_error_result(f"Failed to add to cart: {str(e)}")
    
    async def remove_from_cart(
        self,
        cart_item_id: str,
        credentials: RamiLevyCredentials
    ) -> ShoppingOperationResult:
        """Remove an item from the shopping cart"""
        try:
            # Extract product ID from cart item ID
            product_id = cart_item_id.replace("cart_", "")
            
            current_cart = await self._get_current_cart(credentials)
            if product_id in current_cart:
                del current_cart[product_id]
                success = await self._update_cart(current_cart, credentials)
                
                if not success:
                    return self.create_error_result("Failed to remove item from cart")
                
                return self.create_success_result(True)
            else:
                return self.create_error_result("Item not found in cart")
                
        except Exception as e:
            logger.error(f"Remove from cart error: {e}")
            return self.create_error_result(f"Failed to remove from cart: {str(e)}")
    
    async def update_cart_quantity(
        self,
        cart_item_id: str,
        quantity: int,
        credentials: RamiLevyCredentials
    ) -> ShoppingOperationResult:
        """Update quantity of an item in the cart"""
        try:
            # Extract product ID from cart item ID
            product_id = cart_item_id.replace("cart_", "")
            
            current_cart = await self._get_current_cart(credentials)
            
            if quantity == 0:
                # Remove item if quantity is 0
                if product_id in current_cart:
                    del current_cart[product_id]
            else:
                current_cart[product_id] = quantity
            
            success = await self._update_cart(current_cart, credentials)
            
            if not success:
                return self.create_error_result("Failed to update cart quantity")
            
            cart_item = CartItem(
                id=cart_item_id,
                product_id=product_id,
                product_title=f"Product {product_id}",
                quantity=quantity
            )
            
            return self.create_success_result(cart_item)
            
        except Exception as e:
            logger.error(f"Update cart quantity error: {e}")
            return self.create_error_result(f"Failed to update cart quantity: {str(e)}")
    
    async def get_cart_contents(self, credentials: RamiLevyCredentials) -> ShoppingOperationResult:
        """Get current cart contents"""
        try:
            current_cart = await self._get_current_cart(credentials)
            
            cart_items = []
            total_items = 0
            
            for product_id, quantity in current_cart.items():
                cart_item = CartItem(
                    id=f"cart_{product_id}",
                    product_id=product_id,
                    product_title=f"Product {product_id}",
                    quantity=quantity
                )
                cart_items.append(cart_item)
                total_items += quantity
            
            cart = Cart(
                items=cart_items,
                total_items=total_items,
                currency="ILS",
                website=self.website.value
            )
            
            return self.create_success_result(cart)
            
        except Exception as e:
            logger.error(f"Get cart contents error: {e}")
            return self.create_error_result(f"Failed to get cart contents: {str(e)}")
    
    async def close(self):
        """Close API clients"""
        if self.api_client:
            await self.api_client.close()
        if self.user_api_client:
            await self.user_api_client.close()