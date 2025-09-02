"""Middleware for request processing and security."""

import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log requests and response times."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request info (avoid logging sensitive data)
        logger.info(f"{request.method} {request.url.path} - Client: {request.client.host if request.client else 'unknown'}")
        
        # Check for auth header (don't log the actual token)
        has_auth = "authorization" in request.headers
        if has_auth:
            logger.debug(f"Request includes authorization header")
        
        response = await call_next(request)
        
        # Calculate response time
        process_time = time.time() - start_time
        
        # Log response info
        logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
        
        # Add response headers
        response.headers["X-Process-Time"] = str(process_time)
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        return response