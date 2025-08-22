import { HeaderCredentials } from "../types";

/**
 * Request context manager for storing per-request credentials
 * This is necessary because multiple users may be making concurrent requests
 * and each request needs its own set of credentials
 */
class RequestContextManager {
  private contexts = new Map<string, HeaderCredentials>();
  
  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Store credentials for a request and return the request ID
   */
  storeContext(credentials: HeaderCredentials): string {
    const requestId = this.generateRequestId();
    this.contexts.set(requestId, credentials);
    
    // Auto-cleanup after 5 minutes to prevent memory leaks
    setTimeout(() => {
      this.contexts.delete(requestId);
    }, 5 * 60 * 1000);
    
    return requestId;
  }
  
  /**
   * Get credentials for a request ID
   */
  getContext(requestId: string): HeaderCredentials | null {
    return this.contexts.get(requestId) || null;
  }
  
  /**
   * Clean up context for a request
   */
  clearContext(requestId: string): void {
    this.contexts.delete(requestId);
  }
  
  /**
   * Get current number of active contexts (for debugging)
   */
  getActiveContextsCount(): number {
    return this.contexts.size;
  }
}

// Singleton instance for the entire MCP server
export const requestContextManager = new RequestContextManager();