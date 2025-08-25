"""
HTTP client utility for shopping API requests
"""

import asyncio
import logging
from typing import Dict, Any, Optional, Union
import aiohttp
import json


logger = logging.getLogger(__name__)


class ApiClient:
    """Async HTTP client for shopping API requests"""
    
    def __init__(self, base_url: str, default_headers: Optional[Dict[str, str]] = None):
        self.base_url = base_url.rstrip('/')
        self.default_headers = default_headers or {}
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._ensure_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def _ensure_session(self):
        """Ensure aiohttp session exists"""
        if not self.session or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers=self.default_headers
            )
    
    async def get(
        self, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make GET request"""
        await self._ensure_session()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = {**self.default_headers}
        if headers:
            request_headers.update(headers)
        
        logger.debug(f"GET request to {url} with params: {params}")
        
        try:
            async with self.session.get(url, params=params, headers=request_headers) as response:
                response_text = await response.text()
                
                if response.status >= 400:
                    logger.error(f"GET request failed: {response.status} - {response_text}")
                    raise aiohttp.ClientResponseError(
                        request_info=response.request_info,
                        history=response.history,
                        status=response.status,
                        message=response_text
                    )
                
                try:
                    return await response.json()
                except json.JSONDecodeError:
                    # If response is not JSON, return as text
                    return {"text": response_text}
                    
        except aiohttp.ClientError as e:
            logger.error(f"GET request error: {e}")
            raise
    
    async def post(
        self,
        endpoint: str,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make POST request"""
        await self._ensure_session()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = {**self.default_headers}
        if headers:
            request_headers.update(headers)
        
        logger.debug(f"POST request to {url}")
        
        try:
            kwargs = {"headers": request_headers}
            
            if json_data is not None:
                kwargs["json"] = json_data
            elif data is not None:
                if isinstance(data, dict):
                    kwargs["data"] = data
                else:
                    kwargs["data"] = data
            
            async with self.session.post(url, **kwargs) as response:
                response_text = await response.text()
                
                if response.status >= 400:
                    logger.error(f"POST request failed: {response.status} - {response_text}")
                    raise aiohttp.ClientResponseError(
                        request_info=response.request_info,
                        history=response.history,
                        status=response.status,
                        message=response_text
                    )
                
                try:
                    return await response.json()
                except json.JSONDecodeError:
                    # If response is not JSON, return as text
                    return {"text": response_text}
                    
        except aiohttp.ClientError as e:
            logger.error(f"POST request error: {e}")
            raise
    
    async def put(
        self,
        endpoint: str,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make PUT request"""
        await self._ensure_session()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = {**self.default_headers}
        if headers:
            request_headers.update(headers)
        
        logger.debug(f"PUT request to {url}")
        
        try:
            kwargs = {"headers": request_headers}
            
            if json_data is not None:
                kwargs["json"] = json_data
            elif data is not None:
                if isinstance(data, dict):
                    kwargs["data"] = data
                else:
                    kwargs["data"] = data
            
            async with self.session.put(url, **kwargs) as response:
                response_text = await response.text()
                
                if response.status >= 400:
                    logger.error(f"PUT request failed: {response.status} - {response_text}")
                    raise aiohttp.ClientResponseError(
                        request_info=response.request_info,
                        history=response.history,
                        status=response.status,
                        message=response_text
                    )
                
                try:
                    return await response.json()
                except json.JSONDecodeError:
                    # If response is not JSON, return as text
                    return {"text": response_text}
                    
        except aiohttp.ClientError as e:
            logger.error(f"PUT request error: {e}")
            raise
    
    async def delete(
        self,
        endpoint: str,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make DELETE request"""
        await self._ensure_session()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        request_headers = {**self.default_headers}
        if headers:
            request_headers.update(headers)
        
        logger.debug(f"DELETE request to {url}")
        
        try:
            async with self.session.delete(url, headers=request_headers) as response:
                response_text = await response.text()
                
                if response.status >= 400:
                    logger.error(f"DELETE request failed: {response.status} - {response_text}")
                    raise aiohttp.ClientResponseError(
                        request_info=response.request_info,
                        history=response.history,
                        status=response.status,
                        message=response_text
                    )
                
                try:
                    return await response.json()
                except json.JSONDecodeError:
                    # If response is not JSON, return as text
                    return {"text": response_text}
                    
        except aiohttp.ClientError as e:
            logger.error(f"DELETE request error: {e}")
            raise
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None