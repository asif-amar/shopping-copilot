"""
HTTP client utility for shopping API requests
"""

import asyncio
import logging
import random
import os
import ssl
from typing import Dict, Any, Optional, Union
import aiohttp
import json


logger = logging.getLogger(__name__)


class ApiClient:
    """Async HTTP client for shopping API requests"""
    
    def __init__(self, base_url: str, default_headers: Optional[Dict[str, str]] = None, use_proxy: bool = None):
        self.base_url = base_url.rstrip('/')
        # Enhanced browser-like headers to bypass Cloudflare
        browser_headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"macOS"',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        # Merge with provided headers, giving priority to provided ones
        self.default_headers = browser_headers
        if default_headers:
            self.default_headers.update(default_headers)
        
        self.session: Optional[aiohttp.ClientSession] = None
        self._last_request_time = 0
        
        # Proxy configuration (ISP proxy)
        self.use_proxy = use_proxy if use_proxy is not None else os.getenv('USE_PROXY', 'false').lower() == 'true'
        self.proxy_url = os.getenv('PROXY_URL')
        self.proxy_user = os.getenv('PROXY_USER') 
        self.proxy_pass = os.getenv('PROXY_PASS')
    
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
            # Use connector with SSL verification and connection pooling
            # Configure SSL context for BrightData proxy if needed
            ssl_context = self._create_ssl_context()
            
            connector = aiohttp.TCPConnector(
                limit=100,
                limit_per_host=30,
                ttl_dns_cache=300,
                use_dns_cache=True,
                keepalive_timeout=60,
                enable_cleanup_closed=True,
                ssl=ssl_context
            )
            
            session_kwargs = {
                'timeout': timeout,
                'headers': self.default_headers,
                'connector': connector,
                'cookie_jar': aiohttp.CookieJar()
            }
            
            # Add proxy configuration if enabled
            if self.use_proxy and self.proxy_url:
                proxy_auth = None
                if self.proxy_user and self.proxy_pass:
                    proxy_auth = aiohttp.BasicAuth(self.proxy_user, self.proxy_pass)
                
                # Use HTTP for proxy URL (aiohttp handles HTTPS internally)
                proxy_url = f"http://{self.proxy_url}"
                logger.info(f"Configuring ISP proxy: {proxy_url} (auth: {'yes' if proxy_auth else 'no'})")
                
                # Store proxy configuration for requests
                self._proxy_url = proxy_url
                self._proxy_auth = proxy_auth
            else:
                self._proxy_url = None
                self._proxy_auth = None
            
            self.session = aiohttp.ClientSession(**session_kwargs)
    
    async def _add_human_delay(self):
        """Add random delay between requests to appear more human-like"""
        import time
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        
        # Add 0.5-2.0 second delay if last request was less than 1 second ago
        if time_since_last < 1.0:
            delay = random.uniform(0.5, 2.0)
            await asyncio.sleep(delay)
        
        self._last_request_time = time.time()
    
    def _create_ssl_context(self):
        """Create SSL context - ISP proxy doesn't need special certificate"""
        if self.use_proxy and self.proxy_url:
            # ISP proxy works with default SSL context
            logger.info("Using default SSL context for ISP proxy")
            return ssl.create_default_context()
        else:
            # Default SSL context for direct connections
            return ssl.create_default_context()
    
    async def _retry_without_proxy(self, method: str, url: str, **kwargs):
        """Retry request without proxy as fallback"""
        # Remove proxy-related kwargs
        clean_kwargs = {k: v for k, v in kwargs.items() if k not in ['proxy', 'proxy_auth']}
        
        # Make request without proxy
        method_func = getattr(self.session, method)
        async with method_func(url, **clean_kwargs) as response:
            response_text = await response.text()
            
            if response.status >= 400:
                logger.error(f"{method.upper()} request failed (direct): {response.status} - {response_text}")
                raise aiohttp.ClientResponseError(
                    request_info=response.request_info,
                    history=response.history,
                    status=response.status,
                    message=response_text
                )
            
            try:
                return await response.json()
            except json.JSONDecodeError:
                return {"text": response_text}
    
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
        
        # logger.debug(f"GET request to {url} with params: {params}")
        
        # Add human-like delay
        await self._add_human_delay()
        
        try:
            # Prepare request kwargs
            request_kwargs = {
                'params': params,
                'headers': request_headers
            }
            
            # Add proxy if configured
            if self._proxy_url:
                request_kwargs['proxy'] = self._proxy_url
                if self._proxy_auth:
                    request_kwargs['proxy_auth'] = self._proxy_auth
            
            async with self.session.get(url, **request_kwargs) as response:
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
                    
        except aiohttp.ClientProxyConnectionError as e:
            logger.error(f"Proxy connection error: {e}")
            if self._proxy_url:
                logger.warning("Falling back to direct connection due to proxy error")
                return await self._retry_without_proxy('get', url, params=params, headers=request_headers)
            raise
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
        
        # logger.debug(f"POST request to {url}")
        
        # Add human-like delay
        await self._add_human_delay()
        
        try:
            kwargs = {"headers": request_headers}
            
            if json_data is not None:
                kwargs["json"] = json_data
            elif data is not None:
                if isinstance(data, dict):
                    kwargs["data"] = data
                else:
                    kwargs["data"] = data
            
            # Add proxy if configured
            if self._proxy_url:
                kwargs['proxy'] = self._proxy_url
                if self._proxy_auth:
                    kwargs['proxy_auth'] = self._proxy_auth
            
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
                    
        except aiohttp.ClientProxyConnectionError as e:
            logger.error(f"Proxy connection error: {e}")
            if self._proxy_url:
                logger.warning("Falling back to direct connection due to proxy error")
                return await self._retry_without_proxy('post', url, **kwargs)
            raise
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
        
        # Add human-like delay
        await self._add_human_delay()
        
        try:
            kwargs = {"headers": request_headers}
            
            if json_data is not None:
                kwargs["json"] = json_data
            elif data is not None:
                if isinstance(data, dict):
                    kwargs["data"] = data
                else:
                    kwargs["data"] = data
            
            # Add proxy if configured
            if self._proxy_url:
                kwargs['proxy'] = self._proxy_url
                if self._proxy_auth:
                    kwargs['proxy_auth'] = self._proxy_auth
            
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
        
        # Add human-like delay
        await self._add_human_delay()
        
        try:
            # Prepare request kwargs
            request_kwargs = {'headers': request_headers}
            
            # Add proxy if configured
            if self._proxy_url:
                request_kwargs['proxy'] = self._proxy_url
                if self._proxy_auth:
                    request_kwargs['proxy_auth'] = self._proxy_auth
            
            async with self.session.delete(url, **request_kwargs) as response:
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