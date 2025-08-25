"""
Shopping adapter constants and configuration
Mirrors the shared TypeScript constants for consistency across platforms
"""

from dataclasses import dataclass, field
from typing import Dict, Type, List, Optional
from enum import Enum


class SiteAdapterName(str, Enum):
    """Supported shopping website adapters - matches TypeScript SiteAdapterName"""
    RAMI_LEVY = "rami-levy"
    SHUFERSAL = "shufersal"


# Rami Levy header constants - matches TypeScript RAMI_LEVY_HEADERS
class RamiLevyHeaders:
    AUTHORIZATION = "authorization"
    COOKIE = "cookie"
    ECOM_TOKEN = "ecomtoken"
    USER_ID = "userId"


# Shufersal header constants - matches TypeScript SHUFERSAL_HEADERS
class ShufersalHeaders:
    CSRF_TOKEN = "x-csrf-token"
    COOKIE = "cookie"


# Rami Levy credential header constants - matches TypeScript RAMI_LEVY_CREDENTIALS
class RamiLevyCredentialHeaders:
    AUTHORIZATION = "x-rami-levy-authorization"
    COOKIE = "x-rami-levy-cookie"
    ECOM_TOKEN = "x-rami-levy-ecom-token"
    USER_ID = "x-rami-levy-user-id"


# Shufersal credential header constants - matches TypeScript SHUFERSAL_CREDENTIALS
class ShufersalCredentialHeaders:
    CSRF_TOKEN = "x-shufersal-csrf-token"
    COOKIE = "x-shufersal-cookie"


@dataclass
class CredentialFieldMapping:
    """Maps request field names to credential object field names"""
    request_field: str  # Field name in the API request headers
    credential_field: str  # Field name in the credential dataclass
    is_required: bool = True


@dataclass
class AdapterCredentialConfig:
    """Configuration for adapter credential handling"""
    site: SiteAdapterName
    credential_class: Type
    request_headers: Type  # Header constants class
    api_headers: Type  # API header constants class
    field_mappings: List[CredentialFieldMapping] = field(default_factory=list)
    
    def get_header_mapping(self) -> Dict[str, str]:
        """Get mapping from request headers to API headers"""
        mapping = {}
        for field_mapping in self.field_mappings:
            request_header = getattr(self.request_headers, field_mapping.request_field.upper())
            api_header = getattr(self.api_headers, field_mapping.request_field.upper())
            mapping[request_header] = api_header
        return mapping
    
    def get_required_fields(self) -> List[str]:
        """Get list of required credential field names"""
        return [
            getattr(self.request_headers, mapping.request_field.upper())
            for mapping in self.field_mappings 
            if mapping.is_required
        ]


# Adapter configuration registry - will be initialized after imports
ADAPTER_CONFIGS: Dict[SiteAdapterName, AdapterCredentialConfig] = {}


def _initialize_adapter_configs():
    """Initialize adapter configurations - called after all imports are resolved"""
    # Import credential types here to avoid circular imports
    from .types import RamiLevyCredentials, ShufersalCredentials
    
    global ADAPTER_CONFIGS
    ADAPTER_CONFIGS = {
        SiteAdapterName.RAMI_LEVY: AdapterCredentialConfig(
            site=SiteAdapterName.RAMI_LEVY,
            credential_class=RamiLevyCredentials,
            request_headers=RamiLevyCredentialHeaders,
            api_headers=RamiLevyHeaders,
            field_mappings=[
                CredentialFieldMapping("authorization", "api_key", True),
                CredentialFieldMapping("ecom_token", "ecom_token", True),
                CredentialFieldMapping("cookie", "cookie", True),
                CredentialFieldMapping("user_id", "user_id", True),
            ]
        ),
        SiteAdapterName.SHUFERSAL: AdapterCredentialConfig(
            site=SiteAdapterName.SHUFERSAL,
            credential_class=ShufersalCredentials,
            request_headers=ShufersalCredentialHeaders,
            api_headers=ShufersalHeaders,
            field_mappings=[
                CredentialFieldMapping("csrf_token", "csrf_token", True),
                CredentialFieldMapping("cookie", "cookie", True),
            ]
        )
    }


# Initialize configurations
_initialize_adapter_configs()


def get_adapter_config(site: SiteAdapterName) -> Optional[AdapterCredentialConfig]:
    """Get adapter configuration for a site"""
    if not ADAPTER_CONFIGS:
        _initialize_adapter_configs()
    return ADAPTER_CONFIGS.get(site)


def get_supported_sites() -> List[SiteAdapterName]:
    """Get list of all supported sites"""
    return list(ADAPTER_CONFIGS.keys())