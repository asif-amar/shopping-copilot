"""
Agno shopping tools as a unified Toolkit
Port of the MCP server shopping tools functionality
"""

import json
import logging
from typing import Optional, Dict

from agno.tools import Toolkit
from .shopping.constants import SiteAdapterName
from .shopping.types import ProductSearchOptions, PriceRange
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
    ) -> str:
        """Search for products on shopping websites"""
        try:
            logger.info(f"Searching '{query}' on {website}")
            logger.info(f"Request headers: {self._request_headers}")
            
            # Validate website
            try:
                site = SiteAdapterName(website)
            except ValueError:
                return f"**Error**\n\nUnsupported website: {website}. Supported websites: rami-levy, shufersal"
            
            # Security validation
            query_validation = ShoppingSecurity.validate_search_query(query)
            if not query_validation.is_valid:
                return f"**Error**\n\n{query_validation.error}"
            
            category_validation = ShoppingSecurity.validate_category(category)
            if not category_validation.is_valid:
                return f"**Error**\n\n{category_validation.error}"
            
            # Validate price range
            price_range = None
            if price_min is not None and price_max is not None:
                price_range = PriceRange(min=price_min, max=price_max)
                price_range_validation = ShoppingSecurity.validate_price_range(price_range)
                if not price_range_validation.is_valid:
                    return f"**Error**\n\n{price_range_validation.error}"
            
            # Get credentials from headers
            if not self._request_headers:
                return f"**Error**\n\nNo request headers available. Please provide authentication headers."
            
            credentials, credentials_error = ShoppingAdapterFactory.get_credentials_for_website(
                website=site, 
                headers=self._request_headers
            )
            logger.info(f"\nCredentials: {credentials}\n")
            print(f"\nCredentials: {credentials}\n")
            if not credentials:
                return f"**Error**\n\n{credentials_error}"

            
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

            logger.info(f"Search result: {result}")
            
            if not result.success:
                error_msg = ShoppingSecurity.format_secure_error(result.error or "Unknown error")
                return f"**Error**\n\nSearch failed: {error_msg}"
            
            # Format response as JSON array for the agent to use
            search_result = result.data
            products = search_result.products
            total_count = search_result.total_count
            
            if not products:
                return f"מצאתי 0 מוצרים עבור \"{query}\" באתר {website.upper()}.\n\n<product_search_results>\n[]\n</product_search_results>"
            
            # Create the response with Hebrew text followed by individual products for streaming
            # response_parts = []
            # response_parts.append(f"מצאתי {total_count} מוצרים עבור \"{query}\" באתר {website.upper()}:")
            response_parts = [
                f"**Product Search Results**",
                f"**Website:** {website.upper()}",
                f"**Query:** \"{query}\"",
                f"**Found:** {total_count} products",
                ""
            ]
            response_parts.append("\n\n<product_search_results>")
            
            # Stream products individually - each as a separate JSON object
            for i, product in enumerate(products[:10]):  # Limit to 10 results
                # Debug: Log each product being processed
                logger.info(f"Processing product {i+1}: {product.title}, Brand: '{product.brand}'")
                
                product_obj = {
                    "name": product.title,
                    "price": f"{product.currency} {product.price}",
                    "availability": "זמין במלאי" if product.availability else "אזל מהמלאי",
                    "url": product.url,
                    "image": product.image_url if product.image_url else ""
                }
                
                # Add additional fields if available
                if product.brand:
                    product_obj["brand"] = product.brand
                
                if product.category:
                    product_obj["category"] = product.category
                    
                if product.rating:
                    review_text = f" ({product.review_count} ביקורות)" if product.review_count else ""
                    product_obj["rating"] = f"{product.rating}/5{review_text}"
                
                if product.description:
                    # Limit description length
                    description = product.description[:150]
                    if len(product.description) > 150:
                        description += "..."
                    product_obj["description"] = description
                
                product_obj["product_id"] = product.id
                
                # Output individual product JSON
                product_json = json.dumps(product_obj, ensure_ascii=False, indent=2)
                response_parts.append(f"\n<product>{product_json}</product>")
            
            response_parts.append("\n</product_search_results>")
            
            final_response = "".join(response_parts)
            logger.info(f"Final response being sent (first 500 chars): {final_response[:500]}...")
            return final_response
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            error_msg = ShoppingSecurity.format_secure_error(str(e))
            return f"**Error**\n\nFailed to search products: {error_msg}"

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
                total_price_text = f"\n**Total Price:** {cart.currency} {cart.total_price:.2f}" if cart.total_price is not None else ""
                return (
                    f"**Shopping Cart**\n\n"
                    f"**Website:** {website.upper()}\n"
                    f"**Status:** Empty\n"
                    f"**Total Items:** 0{total_price_text}"
                )
            
            response_lines = [
                "**Shopping Cart**",
                f"**Website:** {website.upper()}",
                f"**Total Items:** {cart.total_items}",
            ]
            
            if cart.total_price is not None:
                response_lines.append(f"**Total Price:** {cart.currency} {cart.total_price:.2f}")
            
            response_lines.extend(["", "**Items:**"])
            
            for i, item in enumerate(cart.items, 1):
                item_lines = [f"{i}. **{item.product_title}**", f"   - Quantity: {item.quantity}"]
                
                if item.unit_price is not None:
                    item_lines.append(f"   - Unit Price: {cart.currency} {item.unit_price:.2f}")
                
                if item.total_price is not None:
                    item_lines.append(f"   - Total: {cart.currency} {item.total_price:.2f}")
                
                item_lines.append(f"   - Cart Item ID: {item.id}")
                
                if item.variant:
                    item_lines.append(f"   - Variant: {item.variant}")
                
                response_lines.extend(item_lines)
                response_lines.append("")  # Empty line between items
            
            return "\n".join(response_lines)
            
        except Exception as e:
            logger.error(f"Get cart contents error: {e}")
            error_msg = ShoppingSecurity.format_secure_error(str(e))
            return f"**Error**\n\nFailed to get cart contents: {error_msg}"