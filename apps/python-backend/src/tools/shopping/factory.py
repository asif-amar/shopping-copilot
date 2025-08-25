"""
Factory class for creating shopping website adapters
Port of the TypeScript ShoppingAdapterFactory class
"""

import os
import logging
from typing import Dict, Optional, Tuple, Any

from .types import SiteAdapterName, RamiLevyCredentials, ShufersalCredentials, CredentialsType
from .adapters.base_adapter import BaseShoppingAdapter
from .adapters.rami_levy_adapter import RamiLevyAdapter
from .adapters.shufersal_adapter import ShufersalAdapter


logger = logging.getLogger(__name__)


class ShoppingAdapterFactory:
    """Factory class for creating shopping website adapters"""
    
    # Cache adapters since they are stateless
    _adapters: Dict[SiteAdapterName, BaseShoppingAdapter] = {}
    
    @classmethod
    def get_adapter(cls, website: SiteAdapterName) -> BaseShoppingAdapter:
        """Get or create an adapter for the specified website"""
        
        # Check if adapter already exists in cache
        if website in cls._adapters:
            return cls._adapters[website]
        
        # Create new adapter based on website
        try:
            if website == SiteAdapterName.RAMI_LEVY:
                adapter = RamiLevyAdapter()
            elif website == SiteAdapterName.SHUFERSAL:
                adapter = ShufersalAdapter()
            else:
                raise ValueError(f"Unsupported website: {website}")
            
            # Cache the adapter for reuse
            cls._adapters[website] = adapter
            return adapter
            
        except Exception as e:
            raise RuntimeError(f"Failed to initialize {website} adapter: {str(e)}")
    
    @classmethod
    def get_rami_levy_credentials(cls) -> Optional[RamiLevyCredentials]:
        """Get Rami Levy credentials from environment variables"""
        api_key = os.getenv("RAMI_LEVY_API_KEY")
        ecom_token = os.getenv("RAMI_LEVY_ECOM_TOKEN")
        cookie = os.getenv("RAMI_LEVY_COOKIE")
        user_id = os.getenv("RAMI_LEVY_USER_ID")
        
        if all([api_key, ecom_token, cookie, user_id]):
            return RamiLevyCredentials(
                api_key=api_key,
                ecom_token=ecom_token,
                cookie=cookie,
                user_id=user_id
            )
        
        return None
    
    @classmethod
    def get_shufersal_credentials(cls) -> Optional[ShufersalCredentials]:
        """Get Shufersal credentials from environment variables"""
        csrf_token = os.getenv("SHUFERSAL_CSRF_TOKEN")
        cookie = os.getenv("SHUFERSAL_COOKIE")
        
        if all([csrf_token, cookie]):
            return ShufersalCredentials(
                csrf_token=csrf_token,
                cookie=cookie
            )
        
        return None
    
    @classmethod
    def get_credentials_for_website(
        cls, 
        website: SiteAdapterName,
        header_credentials: Optional[Dict[str, Any]] = None
    ) -> Tuple[Optional[CredentialsType], Optional[str]]:
        """
        Get credentials for a website, trying header credentials first,
        then falling back to environment variables
        
        Returns:
            Tuple of (credentials, error_message)
        """
        
        # First try to get credentials from headers (dynamic per-request)
        print("Header credentials:", header_credentials)

        if header_credentials:
            if website == SiteAdapterName.RAMI_LEVY and "rami_levy_credentials" in header_credentials:
                creds_data = header_credentials["rami_levy_credentials"]
                if all(k in creds_data for k in ["api_key", "ecom_token", "cookie", "user_id"]):
                    return (RamiLevyCredentials(**creds_data), None)
            elif website == SiteAdapterName.SHUFERSAL and "shufersal_credentials" in header_credentials:
                creds_data = header_credentials["shufersal_credentials"]
                if all(k in creds_data for k in ["csrf_token", "cookie"]):
                    return (ShufersalCredentials(**creds_data), None)
        
        # Fallback to environment variables
        if website == SiteAdapterName.RAMI_LEVY:
            credentials = cls.get_rami_levy_credentials()
            if not credentials:
                error = ("Missing Rami Levy credentials. Please provide credentials via request headers "
                        "or check environment variables: RAMI_LEVY_API_KEY, RAMI_LEVY_ECOM_TOKEN, "
                        "RAMI_LEVY_COOKIE, RAMI_LEVY_USER_ID")
                return (None, error)
            return (credentials, None)
            
        elif website == SiteAdapterName.SHUFERSAL:
            credentials = cls.get_shufersal_credentials()
            if not credentials:
                error = ("Missing Shufersal credentials. Please provide credentials via request headers "
                        "or check environment variables: SHUFERSAL_CSRF_TOKEN, SHUFERSAL_COOKIE")
                return (None, error)
            return (credentials, None)
        
        return (None, f"Unsupported website: {website}")
    
    @classmethod
    async def close_all_adapters(cls):
        """Close all cached adapters"""
        for adapter in cls._adapters.values():
            if hasattr(adapter, 'close'):
                await adapter.close()
        cls._adapters.clear()