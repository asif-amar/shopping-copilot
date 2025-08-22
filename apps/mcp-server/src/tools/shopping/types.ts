// Shopping-specific types and interfaces

// Website configuration
export interface WebsiteConfig {
  name: string;
  baseUrl: string;
  apiVersion?: string;
  rateLimitPerMinute: number;
  requiresAuth: boolean;
  authType?: 'api_key' | 'oauth' | 'basic';
}