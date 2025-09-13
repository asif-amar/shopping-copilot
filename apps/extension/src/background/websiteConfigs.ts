import { WebsiteConfig, InterceptEndpoint } from './types';

/**
 * Configuration for supported shopping websites
 * Each config defines how to intercept and capture credentials for a specific site
 */
export const WEBSITE_CONFIGS: Record<string, WebsiteConfig> = {
  'rami-levy': {
    name: 'Rami Levy',
    siteAdapter: 'rami-levy',
    urlPatterns: [
      'https://www.rami-levy.co.il/*',
      'https://rami-levy.co.il/*'
    ],
    interceptEndpoints: [
      { 
        urlPattern: 'rami-levy.co.il/api/catalog', 
        method: 'POST' 
      }
    ],
    requestHeaders: [
      { 
        name: 'authorization', 
        aliases: ['authorization', 'auth', 'bearer'] 
      },
      { 
        name: 'ecomtoken', 
        aliases: ['ecomtoken', 'ecom-token', 'x-ecom-token'] 
      }
    ],
    requiresCookies: true,
    storageKey: 'rami-levy-captured-headers'
  },

  'shufersal': {
    name: 'Shufersal',
    siteAdapter: 'shufersal',
    urlPatterns: [
      'https://www.shufersal.co.il/*',
      'https://shufersal.co.il/*',
      'https://online.shufersal.co.il/*'
    ],
    interceptEndpoints: [
      { 
        urlPattern: 'shufersal.co.il/api/products', 
        method: 'POST' 
      },
      { 
        urlPattern: 'online.shufersal.co.il/api/catalog', 
        method: 'POST' 
      }
    ],
    requestHeaders: [
      { 
        name: 'csrf-token', 
        aliases: ['x-csrf-token', 'csrf-token', 'x-xsrf-token'] 
      }
    ],
    requiresCookies: true,
    storageKey: 'shufersal-captured-headers'
  }
};

/**
 * Get all URL patterns for webRequest listener registration
 */
export function getAllUrlPatterns(): string[] {
  const patterns: string[] = [];
  Object.values(WEBSITE_CONFIGS).forEach(config => {
    patterns.push(...config.urlPatterns);
  });
  return patterns;
}

/**
 * Find website config by URL
 */
export function findWebsiteConfigByUrl(url: string): WebsiteConfig | null {
  for (const config of Object.values(WEBSITE_CONFIGS)) {
    // Check if URL matches any of the intercept endpoints
    const matchesEndpoint = config.interceptEndpoints.some((endpoint: InterceptEndpoint) => 
      url.includes(endpoint.urlPattern)
    );
    
    if (matchesEndpoint) {
      return config;
    }
  }
  return null;
}

/**
 * Check if request should be intercepted
 */
export function shouldInterceptRequest(url: string, method: string): WebsiteConfig | null {
  const config = findWebsiteConfigByUrl(url);
  if (!config) return null;

  // Check if method matches
  const matchesMethodAndEndpoint = config.interceptEndpoints.some((endpoint: InterceptEndpoint) => 
    url.includes(endpoint.urlPattern) && endpoint.method.toLowerCase() === method.toLowerCase()
  );

  return matchesMethodAndEndpoint ? config : null;
}

/**
 * Add a new website configuration (for future extensibility)
 */
export function addWebsiteConfig(key: string, config: WebsiteConfig): void {
  WEBSITE_CONFIGS[key] = config;
}