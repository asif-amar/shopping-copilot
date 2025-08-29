"""
Factory class for creating shopping website adapters
Dynamic and scalable adapter factory with credential management
"""

import logging
from typing import Dict, Optional, Tuple

from .constants import SiteAdapterName, get_supported_sites
from .credential_manager import CredentialManager
from .types import CredentialsType
from .adapters.base_adapter import BaseShoppingAdapter
from .adapters.rami_levy_adapter import RamiLevyAdapter
from .adapters.shufersal_adapter import ShufersalAdapter


logger = logging.getLogger(__name__)


class ShoppingAdapterFactory:
    """Dynamic factory class for creating shopping website adapters"""
    
    # Cache adapters since they are stateless
    _adapters: Dict[SiteAdapterName, BaseShoppingAdapter] = {}
    
    # Registry of adapter classes
    _adapter_classes: Dict[SiteAdapterName, type] = {
        SiteAdapterName.RAMI_LEVY: RamiLevyAdapter,
        SiteAdapterName.SHUFERSAL: ShufersalAdapter,
    }
    
    @classmethod
    def get_adapter(cls, website: SiteAdapterName) -> BaseShoppingAdapter:
        """Get or create an adapter for the specified website"""
        
        # Check if adapter already exists in cache
        if website in cls._adapters:
            return cls._adapters[website]
        
        # Get adapter class from registry
        adapter_class = cls._adapter_classes.get(website)
        if not adapter_class:
            supported_sites = ', '.join([site.value for site in get_supported_sites()])
            raise ValueError(f"Unsupported website: {website}. Supported sites: {supported_sites}")
        
        # Create new adapter instance
        try:
            adapter = adapter_class()
            
            # Cache the adapter for reuse
            cls._adapters[website] = adapter
            return adapter
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize {website} adapter: {str(e)}")
    
    @classmethod
    def register_adapter(cls, site: SiteAdapterName, adapter_class: type) -> None:
        """Register a new adapter class for a website"""
        if not issubclass(adapter_class, BaseShoppingAdapter):
            raise ValueError(f"Adapter class must inherit from BaseShoppingAdapter")
        
        cls._adapter_classes[site] = adapter_class
        logger.info(f"Registered adapter {adapter_class.__name__} for site {site}")
    
    @classmethod
    def get_supported_sites_list(cls) -> list[SiteAdapterName]:
        """Get list of supported websites"""
        return list(cls._adapter_classes.keys())
    
    @classmethod
    def get_credentials_for_website(
        cls, 
        website: SiteAdapterName,
        headers: Dict[str, str]
    ) -> Tuple[Optional[CredentialsType], Optional[str]]:
        """
        Get credentials for a website from request headers only
        
        Args:
            website: Target website
            headers: Request headers containing credentials
        
        Returns:
            Tuple of (credentials, error_message)
        """
        logger.debug(f"Getting credentials for {website}")
        
        # Use credential manager to extract from headers only
        credentials, error = CredentialManager.get_credential_from_headers(
            site=website,
            headers=headers
        )
        
        if credentials:
            # Validate credentials
            is_valid, validation_error = CredentialManager.validate_credentials(website, credentials)
            if not is_valid:
                return None, validation_error
            
            logger.info(f"Successfully obtained and validated credentials for {website}")
            return credentials, None
        
        return None, error
    
    @classmethod
    def create_api_headers(
        cls,
        website: SiteAdapterName,
        credentials: CredentialsType,
        base_headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Create API headers from credentials using credential manager
        
        Args:
            website: Target website
            credentials: Site-specific credentials
            base_headers: Optional base headers to merge with
        
        Returns:
            Headers dictionary ready for API requests
        """
        return CredentialManager.create_api_headers(website, credentials, base_headers)
    
    @classmethod
    async def close_all_adapters(cls):
        """Close all cached adapters"""
        for adapter in cls._adapters.values():
            if hasattr(adapter, 'close'):
                await adapter.close()
        cls._adapters.clear()
        logger.info("All adapters closed and cache cleared")