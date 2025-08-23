import { 
  SiteAdapterNameValues, 
  SiteAdapterName, 
  RamiLevyHeaders, 
  ShufersalHeaders
} from '@shopping-copilot/shared';

/**
 * Extract credentials from page context for different shopping sites
 */
export class CredentialExtractor {
  
  /**
   * Extract Rami Levy credentials from the current page
   */
  static async extractRamiLevyCredentials(): Promise<RamiLevyHeaders | null> {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        return null;
      }

      // Inject script to extract credentials from page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          
          let authToken = '';
          let ecomToken = '';
          let userId = '';
          
          // Extract Rami Levy tokens from the specific location: ramilevy -> authuser -> user -> token (ecom token)
          try {
            const ramilevyData = localStorage.getItem('ramilevy');
            
            if (ramilevyData && ramilevyData.length < 10000) { // Prevent large payload attacks
              const parsedData = JSON.parse(ramilevyData);
              
              // The token at ramilevy.authuser.user.token is the ECOM token, not authorization
              if (parsedData.authuser && parsedData.authuser.user && parsedData.authuser.user.token) {
                ecomToken = parsedData.authuser.user.token;
              }
              
              // Get user ID from the same location
              if (parsedData.authuser && parsedData.authuser.user && parsedData.authuser.user.id) {
                userId = parsedData.authuser.user.id.toString();
              }
              
              // Look for authorization token in other parts of the structure
              if (parsedData.authuser && parsedData.authuser.authorization) {
                authToken = parsedData.authuser.authorization;
              } else if (parsedData.authuser && parsedData.authuser.auth_token) {
                authToken = parsedData.authuser.auth_token;
              } else if (parsedData.authorization) {
                authToken = parsedData.authorization;
              }
              
              // Also check for other possible ecom token locations
              if (!ecomToken && parsedData.ecomToken) {
                ecomToken = parsedData.ecomToken;
              }
            }
          } catch (error) {
            // Silently handle parsing errors
          }
          
          // Fallback: try other common locations if not found in ramilevy
          if (!authToken) {
            const fallbackKeys = ['token', 'authToken', 'auth_token', 'accessToken', 'bearer_token'];
            for (const key of fallbackKeys) {
              const value = localStorage.getItem(key) || sessionStorage.getItem(key);
              if (value && value.length < 2000 && /^[a-zA-Z0-9._-]+$/.test(value)) { // Basic token validation
                authToken = value;
                break;
              }
            }
          }
          
          // Extract from cookies
          const cookies = document.cookie;
          
          // Try to extract tokens from cookies as well
          if (cookies && cookies.length < 8000) { // Prevent cookie bomb attacks
            const cookiePairs = cookies.split(';');
            for (const pair of cookiePairs) {
              const [name, value] = pair.trim().split('=');
              if (name && value && name.length < 100 && value.length < 1000) {
                try {
                  // Look for authorization tokens in cookies
                  if (!authToken && (name === 'authorization' || name === 'auth_token' || name === 'bearer' || name === 'jwt')) {
                    authToken = decodeURIComponent(value);
                  }
                  // Look for ecom tokens in cookies
                  if (!ecomToken && (name === 'ecom_token' || name === 'ecomtoken' || name === 'session_token')) {
                    ecomToken = decodeURIComponent(value);
                  }
                  // Look for user ID in cookies
                  if (!userId && (name === 'user_id' || name === 'userId' || name === 'customer_id')) {
                    userId = decodeURIComponent(value);
                  }
                } catch (e) {
                  // Skip malformed cookies
                }
              }
            }
          }
          
          const authorization = authToken || '';
          const cookie = cookies || '';
          
          if (authorization || ecomToken || cookie || userId) {
            const result = {
              AUTHORIZATION: authorization,
              ECOM_TOKEN: ecomToken || '',
              COOKIE: cookie,
              USER_ID: userId || '',
            };
            return result;
          }
          
          return null;
        },
        args: []
      });

      return results[0]?.result || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract Shufersal credentials from the current page
   */
  static async extractShufersalCredentials(): Promise<ShufersalHeaders | null> {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        return null;
      }

      // Inject script to extract credentials from page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          
          // Try to extract CSRF token from meta tags
          const csrfMeta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
          const csrfToken = csrfMeta?.content || '';
          
          // Try to extract from hidden inputs
          const csrfInput = document.querySelector('input[name="_token"]') as HTMLInputElement;
          const tokenFromInput = csrfInput?.value || '';
          
          // Also try to get from localStorage
          const csrfFromStorage = localStorage.getItem('csrf_token') || 
                                 sessionStorage.getItem('csrf_token');
          
          // Extract from cookies
          const cookies = document.cookie;
          
          const finalCsrfToken = csrfToken || tokenFromInput || csrfFromStorage || '';
          
          if (finalCsrfToken || cookies) {
            const result = {
              CSRF_TOKEN: finalCsrfToken,
              COOKIE: cookies || '',
            };
            return result;
          }
          
          return null;
        },
        args: []
      });

      return results[0]?.result || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract credentials based on site adapter
   */
  static async extractCredentialsForSite(
    siteAdapter: SiteAdapterNameValues
  ): Promise<RamiLevyHeaders | ShufersalHeaders | null> {
    
    switch (siteAdapter) {
      case SiteAdapterName.ramiLevy:
        return await this.extractRamiLevyCredentials();
      case SiteAdapterName.shufersal:
        return await this.extractShufersalCredentials();
      default:
        return null;
    }
  }
}