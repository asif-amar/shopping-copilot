"""
Agno shopping tools as a unified Toolkit
Port of the MCP server shopping tools functionality
"""

import logging
from typing import Optional, Dict, List

from agno.tools import Toolkit
from .shopping.constants import SiteAdapterName
from .shopping.types import ProductSearchOptions, PriceRange, ProductResponse
from .shopping.factory import ShoppingAdapterFactory
from .shopping.security import ShoppingSecurity


logger = logging.getLogger(__name__)


class ShoppingTools(Toolkit):
    def __init__(self, request_headers: Dict[str, str], **kwargs):
        # Store request headers - will be set during tool execution
        self._request_headers: Optional[Dict[str, str]] = request_headers
        
        super().__init__(
            name="shopping_tools",
            tools=[
                self.search_products,
                self.add_to_cart,
                self.remove_from_cart,
                self.update_cart_quantity,
                self.get_cart_contents,
            ],
            **kwargs
        )
    
    def set_request_headers(self, headers: Dict[str, str]):
        """Set request headers for credential extraction"""
        self._request_headers = headers
    

    async def search_products(
        self,
        website: str,
        query: str,
        category: Optional[str] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None
    ) -> List[ProductResponse]:
        """
        Search for products on shopping websites
        
        Args:
            website (str): The shopping website to search on
            query (str): The search query
            category (Optional[str], optional): The product category. Defaults to None.
            price_min (Optional[float], optional): The minimum price. Defaults to None.
            price_max (Optional[float], optional): The maximum price. Defaults to None.
        
        Returns:
            List[ProductResponse]: A list of products matching the search criteria
        """
        try:
            logger.info(f"Searching '{query}' on {website}")
            
            # Validate website
            try:
                site = SiteAdapterName(website)
            except ValueError:
                raise ValueError(f"Unsupported website: {website}. Supported websites: rami-levy, shufersal")
            
            # Security validation
            query_validation = ShoppingSecurity.validate_search_query(query)
            if not query_validation.is_valid:
                raise ValueError(f"Invalid query: {query_validation.error}")
            
            category_validation = ShoppingSecurity.validate_category(category)
            if not category_validation.is_valid:
                raise ValueError(f"Invalid category: {category_validation.error}")
            
            # Validate price range
            price_range = None
            if price_min is not None and price_max is not None:
                price_range = PriceRange(min=price_min, max=price_max)
                price_range_validation = ShoppingSecurity.validate_price_range(price_range)
                if not price_range_validation.is_valid:
                    raise ValueError(f"Invalid price range: {price_range_validation.error}")
            
            # Get credentials from headers
            if not self._request_headers:
                raise ValueError("No request headers available. Please provide authentication headers.")
            
            credentials, credentials_error = ShoppingAdapterFactory.get_credentials_for_website(
                website=site, 
                headers=self._request_headers
            )

            if not credentials:
                raise ValueError(f"Authentication error: {credentials_error}")

            
            # Get adapter
            adapter = ShoppingAdapterFactory.get_adapter(site)
            
            # Create search options
            options = ProductSearchOptions(
                query=query_validation.sanitized,
                category=category_validation.sanitized if category_validation.sanitized else None,
                price_range=price_range
            )
            
            # Execute search
            result = await adapter.search_products(options, credentials)
            
            if not result.success:
                error_msg = ShoppingSecurity.format_secure_error(result.error or "Unknown error")
                raise RuntimeError(f"Search failed: {error_msg}")
            
            # Format response as structured array for the agent to use
            search_result = result.data
            products = search_result.products
            
            if not products:
                return []  # Return empty array instead of formatted string
            
            # Create structured product responses
            structured_products = []
            
            # Process products individually and create ProductResponse objects
            for i, product in enumerate(products[:10]):  # Limit to 10 results
                # Debug: Log each product being processed
                logger.info(f"Processing product {i+1}: {product.title}, Brand: '{product.brand}'")
                
                # Format price with ש״ח symbol
                currency_symbol = "ש״ח" if product.currency.upper() in ["ILS", "NIS"] else product.currency
                formatted_price = f"{product.price} {currency_symbol}"
                
                # Create ProductResponse object
                product_response = ProductResponse(
                    name=product.title or "לא זמין",
                    price=formatted_price or "לא זמין",
                    availability="זמין במלאי" if product.availability else "אזל מהמלאי",
                    url=product.url or "",
                    image=product.image_url or "",
                    brand=product.brand or "",
                    category=product.category or "",
                    rating=f"{product.rating}/5 ({product.review_count} ביקורות)" if product.rating and product.review_count else f"{product.rating}/5" if product.rating else "לא זמין",
                    description=product.description[:150] + "..." if product.description and len(product.description) > 150 else product.description,
                    product_id=product.id or ""
                )
                
                structured_products.append(product_response)
            
            logger.info(f"Returning {len(structured_products)} structured products")
            return structured_products
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            raise e  # Let Agno handle the error for proper streaming

    async def add_to_cart(
        self,
        website: str,
        product_id: str,
        quantity: int,
        variant: Optional[str] = None
    ) -> str:
        """Add a product to shopping cart"""
        try:
            logger.info(f"Adding to cart: {product_id} (qty: {quantity}) on {website}")
            
            # Validate website
            try:
                site = SiteAdapterName(website)
            except ValueError:
                return f"**Error**\n\nUnsupported website: {website}"
            
            # Security validation
            product_id_validation = ShoppingSecurity.validate_product_id(product_id, site)
            if not product_id_validation.is_valid:
                return f"**Error**\n\n{product_id_validation.error}"
            
            quantity_validation = ShoppingSecurity.validate_quantity(quantity)
            if not quantity_validation.is_valid:
                return f"**Error**\n\n{quantity_validation.error}"
            
            variant_validation = ShoppingSecurity.validate_variant(variant)
            if not variant_validation.is_valid:
                return f"**Error**\n\n{variant_validation.error}"
            
            # Get credentials from headers
            if not self._request_headers:
                return f"**Error**\n\nNo request headers available. Please provide authentication headers."
            
            credentials, credentials_error = ShoppingAdapterFactory.get_credentials_for_website(
                website=site, 
                headers=self._request_headers
            )
            if not credentials:
                return f"**Error**\n\n{credentials_error}"
            
            # Get adapter
            adapter = ShoppingAdapterFactory.get_adapter(site)
            
            # Add to cart
            result = await adapter.add_to_cart(
                product_id_validation.sanitized,
                quantity,
                credentials,
                variant_validation.sanitized if variant_validation.sanitized else None
            )
            
            if not result.success:
                error_msg = ShoppingSecurity.format_secure_error(result.error or "Unknown error")
                return f"**Error**\n\nFailed to add to cart: {error_msg}"
            
            # Format response
            cart_result = result.data
            
            if isinstance(cart_result, str):
                return f"**Added to Cart**\n\n**Website:** {website.upper()}\n**Result:** {cart_result}"
            else:
                # Handle CartItem response
                cart_item = cart_result
                response_lines = [
                    "**Added to Cart**",
                    f"**Website:** {website.upper()}",
                    f"**Product:** {cart_item.product_title}",
                    f"**Quantity:** {cart_item.quantity}",
                ]
                
                if cart_item.unit_price is not None:
                    response_lines.append(f"**Unit Price:** {cart_item.unit_price:.2f}")
                
                if cart_item.total_price is not None:
                    response_lines.append(f"**Total Price:** {cart_item.total_price:.2f}")
                
                response_lines.append(f"**Cart Item ID:** {cart_item.id}")
                
                if cart_item.variant:
                    response_lines.append(f"**Variant:** {cart_item.variant}")
                
                return "\n".join(response_lines)
            
        except Exception as e:
            logger.error(f"Add to cart error: {e}")
            error_msg = ShoppingSecurity.format_secure_error(str(e))
            return f"**Error**\n\nFailed to add to cart: {error_msg}"

    async def remove_from_cart(
        self,
        website: str,
        cart_item_id: str
    ) -> str:
        """Remove an item from shopping cart"""
        try:
            logger.info(f"Removing from cart: {cart_item_id} on {website}")
            
            # Validate website
            try:
                site = SiteAdapterName(website)
            except ValueError:
                return f"**Error**\n\nUnsupported website: {website}"
            
            # Security validation
            cart_item_validation = ShoppingSecurity.validate_cart_item_id(cart_item_id)
            if not cart_item_validation.is_valid:
                return f"**Error**\n\n{cart_item_validation.error}"
            
            # Get credentials from headers
            if not self._request_headers:
                return f"**Error**\n\nNo request headers available. Please provide authentication headers."
            
            credentials, credentials_error = ShoppingAdapterFactory.get_credentials_for_website(
                website=site, 
                headers=self._request_headers
            )
            if not credentials:
                return f"**Error**\n\n{credentials_error}"
            
            # Get adapter
            adapter = ShoppingAdapterFactory.get_adapter(site)
            
            # Remove from cart
            result = await adapter.remove_from_cart(cart_item_validation.sanitized, credentials)
            
            if not result.success:
                error_msg = ShoppingSecurity.format_secure_error(result.error or "Unknown error")
                return f"**Error**\n\nFailed to remove from cart: {error_msg}"
            
            return f"**Removed from Cart**\n\n**Website:** {website.upper()}\n**Cart Item:** {cart_item_id}\n**Status:** Successfully removed"
            
        except Exception as e:
            logger.error(f"Remove from cart error: {e}")
            error_msg = ShoppingSecurity.format_secure_error(str(e))
            return f"**Error**\n\nFailed to remove from cart: {error_msg}"

    async def update_cart_quantity(
        self,
        website: str,
        cart_item_id: str,
        quantity: int
    ) -> str:
        """Update quantity of item in shopping cart"""
        try:
            logger.info(f"Updating cart quantity: {cart_item_id} to {quantity} on {website}")
            
            # Validate website
            try:
                site = SiteAdapterName(website)
            except ValueError:
                return f"**Error**\n\nUnsupported website: {website}"
            
            # Security validation
            cart_item_validation = ShoppingSecurity.validate_cart_item_id(cart_item_id)
            if not cart_item_validation.is_valid:
                return f"**Error**\n\n{cart_item_validation.error}"
            
            quantity_validation = ShoppingSecurity.validate_quantity(quantity)
            if not quantity_validation.is_valid:
                return f"**Error**\n\n{quantity_validation.error}"
            
            # Get credentials from headers
            if not self._request_headers:
                return f"**Error**\n\nNo request headers available. Please provide authentication headers."
            
            credentials, credentials_error = ShoppingAdapterFactory.get_credentials_for_website(
                website=site, 
                headers=self._request_headers
            )
            if not credentials:
                return f"**Error**\n\n{credentials_error}"
            
            # Get adapter
            adapter = ShoppingAdapterFactory.get_adapter(site)
            
            # Update quantity
            result = await adapter.update_cart_quantity(
                cart_item_validation.sanitized, quantity, credentials
            )
            
            if not result.success:
                error_msg = ShoppingSecurity.format_secure_error(result.error or "Unknown error")
                return f"**Error**\n\nFailed to update cart quantity: {error_msg}"
            
            cart_item = result.data
            
            return (
                f"**Cart Updated**\n\n"
                f"**Website:** {website.upper()}\n"
                f"**Product:** {cart_item.product_title}\n"
                f"**New Quantity:** {cart_item.quantity}\n"
                f"**Unit Price:** {cart_item.unit_price or 'N/A'}\n"
                f"**New Total Price:** {cart_item.total_price or 'N/A'}"
            )
            
        except Exception as e:
            logger.error(f"Update cart quantity error: {e}")
            error_msg = ShoppingSecurity.format_secure_error(str(e))
            return f"**Error**\n\nFailed to update cart quantity: {error_msg}"

    async def get_cart_contents(
        self,
        website: str
    ) -> str:
        """Get current shopping cart contents"""
        try:
            logger.info(f"Getting cart contents for {website}")
            
            # Validate website
            try:
                site = SiteAdapterName(website)
            except ValueError:
                return f"**Error**\n\nUnsupported website: {website}"
            
            # Get credentials from headers
            if not self._request_headers:
                return f"**Error**\n\nNo request headers available. Please provide authentication headers."
            
            credentials, credentials_error = ShoppingAdapterFactory.get_credentials_for_website(
                website=site, 
                headers=self._request_headers
            )
            if not credentials:
                return f"**Error**\n\n{credentials_error}"
            
            # Get adapter
            adapter = ShoppingAdapterFactory.get_adapter(site)
            
            # Get cart contents
            result = await adapter.get_cart_contents(credentials)
            
            if not result.success:
                error_msg = ShoppingSecurity.format_secure_error(result.error or "Unknown error")
                return f"**Error**\n\nFailed to get cart contents: {error_msg}"
            
            cart = result.data
            
            if len(cart.items) == 0:
                return (
                    f"**העגלה ריקה**\n\n"
                    f"**אתר:** {website.upper()}\n"
                    f"**סטטוס:** העגלה ריקה\n"
                    f"**סה\"כ פריטים:** 0"
                )

            # Build text summary
            response_lines = [
                f"**עגלת קניות - {website.upper()}**",
                f"**סה\"כ פריטים:** {cart.total_items}",
            ]
            
            if cart.total_price is not None:
                currency_symbol = "ש״ח" if cart.currency.upper() in ["ILS", "NIS"] else cart.currency
                response_lines.append(f"**סה\"כ מחיר:** {cart.total_price:.2f} {currency_symbol}")
            
            response_lines.append("")
            
            # Add cart items as structured XML for frontend parsing
            for item in cart.items:
                # Format prices with proper currency symbols
                currency_symbol = "ש״ח" if cart.currency.upper() in ["ILS", "NIS"] else cart.currency
                
                unit_price_formatted = f"{item.unit_price:.2f} {currency_symbol}" if item.unit_price is not None else "לא זמין"
                total_price_formatted = f"{item.total_price:.2f} {currency_symbol}" if item.total_price is not None else "לא זמין"
                
                # Create cart item object for frontend
                cart_item_obj = {
                    "name": item.product_title or "פריט לא זמין",
                    "price": unit_price_formatted,
                    "total_price": total_price_formatted,
                    "quantity": item.quantity,
                    "availability": "זמין במלאי",  # Assume available if in cart
                    "image": item.image_url or "",
                    "brand": item.brand or "",
                    "category": item.category or "",
                    "description": item.description or "",
                    "cart_item_id": item.id
                }
                
                import json
                response_lines.append(f"<cart-item>{json.dumps(cart_item_obj, ensure_ascii=False)}</cart-item>")
            
            return "\n".join(response_lines)
            
        except Exception as e:
            logger.error(f"Get cart contents error: {e}")
            error_msg = ShoppingSecurity.format_secure_error(str(e))
            return f"**Error**\n\nFailed to get cart contents: {error_msg}"