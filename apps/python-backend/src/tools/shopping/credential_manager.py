"""
Dynamic credential management for shopping adapters
Handles credential extraction, validation, and conversion between formats
"""

import logging
from typing import Dict, Optional, Tuple, Type

from .constants import (
    SiteAdapterName, 
    ADAPTER_CONFIGS, 
    get_adapter_config,
    AdapterCredentialConfig
)
from .types import RamiLevyCredentials, ShufersalCredentials, CredentialsType


logger = logging.getLogger(__name__)


class CredentialManager:
    """Manages credential extraction and validation for all adapters"""
    
    @staticmethod
    def extract_credentials_from_headers(
        site: SiteAdapterName, 
        headers: Dict[str, str]
    ) -> Tuple[Optional[CredentialsType], Optional[str]]:
        """
        Extract credentials from request headers for a specific site
        
        Args:
            site: The target website
            headers: Request headers containing credentials
            
        Returns:
            Tuple of (credentials, error_message)
        """
        config = get_adapter_config(site)
        if not config:
            return None, f"Unsupported site: {site}"
        
        # Extract credential values from headers
        credential_data = {}
        missing_fields = []
        
        for field_mapping in config.field_mappings:
            header_key = getattr(config.request_headers, field_mapping.request_field.upper())
            header_value = headers.get(header_key)
            
            if header_value:
                credential_data[field_mapping.credential_field] = header_value
            elif field_mapping.is_required:
                missing_fields.append(header_key)
        
        if missing_fields:
            return None, f"Missing required credentials for {site}: {', '.join(missing_fields)}"
        
        # Create credential object
        try:
            credentials = config.credential_class(**credential_data)
            return credentials, None
        except TypeError as e:
            return None, f"Invalid credential format for {site}: {str(e)}"
    
    
    
    @staticmethod
    def create_api_headers(
        site: SiteAdapterName,
        credentials: CredentialsType,
        base_headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Create API headers from credentials for a specific site
        
        Args:
            site: The target website
            credentials: Site-specific credentials
            base_headers: Optional base headers to merge with
            
        Returns:
            Headers dictionary ready for API requests
        """
        config = get_adapter_config(site)
        if not config:
            raise ValueError(f"Unsupported site: {site}")
        
        headers = base_headers.copy() if base_headers else {}
        
        # Map credential fields to API headers
        for field_mapping in config.field_mappings:
            credential_value = getattr(credentials, field_mapping.credential_field, None)
            if credential_value:
                api_header_name = getattr(config.api_headers, field_mapping.request_field.upper())
                headers[api_header_name] = credential_value
        
        return headers
    
    @staticmethod
    def get_credential_from_headers(
        site: SiteAdapterName,
        headers: Dict[str, str]
    ) -> Tuple[Optional[CredentialsType], Optional[str]]:
        """
        Get credentials from request headers only
        
        Args:
            site: The target website
            headers: Request headers containing credentials
            
        Returns:
            Tuple of (credentials, error_message)
        """
        credentials, _ = CredentialManager.extract_credentials_from_headers(site, headers)
        if credentials:
            logger.info(f"Successfully extracted {site} credentials from headers")
            return credentials, None
        
        # Failed to get credentials from headers
        config = get_adapter_config(site)
        required_headers = config.get_required_fields() if config else []
        return None, (
            f"Failed to obtain credentials for {site} from request headers. "
            f"Required headers: {', '.join(required_headers)}"
        )
    
    @staticmethod
    def validate_credentials(site: SiteAdapterName, credentials: CredentialsType) -> Tuple[bool, Optional[str]]:
        """
        Validate that credentials are properly formatted for a site
        
        Args:
            site: The target website
            credentials: Credentials to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        config = get_adapter_config(site)
        if not config:
            return False, f"Unsupported site: {site}"
        
        # Check if credentials are of the correct type
        if not isinstance(credentials, config.credential_class):
            return False, f"Invalid credential type for {site}. Expected {config.credential_class.__name__}"
        
        # Check required fields have values
        missing_values = []
        for field_mapping in config.field_mappings:
            if field_mapping.is_required:
                value = getattr(credentials, field_mapping.credential_field, None)
                if not value or (isinstance(value, str) and not value.strip()):
                    missing_values.append(field_mapping.credential_field)
        
        if missing_values:
            return False, f"Empty required credential fields for {site}: {', '.join(missing_values)}"
        
        return True, None