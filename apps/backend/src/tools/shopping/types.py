"""
Shopping-specific types and data classes
Port of TypeScript interfaces from the MCP server
"""

from dataclasses import dataclass
from typing import Optional, List, Literal, Any
from pydantic import BaseModel


@dataclass
class Product:
    """Product information structure"""
    id: str
    title: str
    description: str
    price: float
    currency: str = "ILS"
    image_url: Optional[str] = None
    availability: bool = True
    rating: Optional[float] = None
    review_count: Optional[int] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    url: Optional[str] = None


@dataclass
class PriceRange:
    """Price range for product filtering"""
    min: float
    max: float


@dataclass
class ProductSearchOptions:
    """Options for product search"""
    query: str
    category: Optional[str] = None
    price_range: Optional[PriceRange] = None


@dataclass
class ProductSearchResult:
    """Result of product search operation"""
    products: List[Product]
    total_count: int
    website: str


@dataclass
class CartItem:
    """Item in shopping cart"""
    id: str
    product_id: str
    product_title: str
    quantity: int
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    variant: Optional[str] = None
    image_url: Optional[str] = None


@dataclass
class Cart:
    """Shopping cart contents"""
    items: List[CartItem]
    total_items: int
    total_price: Optional[float] = None
    currency: str = "ILS"
    website: str = ""


@dataclass
class ShoppingOperationResult:
    """Generic result wrapper for shopping operations"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    website: Optional[str] = None


@dataclass
class WebsiteConfig:
    """Website configuration"""
    name: str
    base_url: str
    api_version: Optional[str] = None
    rate_limit_per_minute: int = 60
    requires_auth: bool = True
    auth_type: Optional[Literal['api_key', 'oauth', 'basic']] = None


@dataclass
class RamiLevyCredentials:
    """Rami Levy API credentials"""
    api_key: str
    ecom_token: str
    cookie: str
    user_id: str


@dataclass
class ShufersalCredentials:
    """Shufersal API credentials"""
    csrf_token: str
    cookie: str


# Type aliases for credential types
CredentialsType = RamiLevyCredentials | ShufersalCredentials


# Pydantic models for structured responses (for Agno streaming)
class ProductResponse(BaseModel):
    """Pydantic model for structured product response"""
    name: str
    price: str
    availability: str
    url: str
    image: Optional[str] = ""
    brand: Optional[str] = None
    category: Optional[str] = None
    rating: Optional[str] = None
    description: Optional[str] = None
    product_id: str

    class Config:
        json_encoders = {
            # Ensure Hebrew text is properly handled
            str: lambda v: v
        }