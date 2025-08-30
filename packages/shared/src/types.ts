import { SiteAdapterName, SiteAdapterNameValues, SITE_HEADER_MAPPINGS } from './constants.js';

// Header types for each adapter
export type RamiLevyHeaders = {
  AUTHORIZATION: string;
  COOKIE: string;
  ECOM_TOKEN: string;
  USER_ID: string;
};

export type ShufersalHeaders = {
  CSRF_TOKEN: string;
  COOKIE: string;
};

// Generic union type for all site headers
export type SiteHeaders = RamiLevyHeaders | ShufersalHeaders;

export type SiteHeadersByAdapter = {
  [SiteAdapterName.ramiLevy]: RamiLevyHeaders;
  [SiteAdapterName.shufersal]: ShufersalHeaders;
};

// Product data structures (shared across apps)
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl?: string;
  availability: boolean;
  rating?: number;
  reviewCount?: number;
  category?: string;
  brand?: string;
  url?: string;
}

export interface ProductSearchOptions {
  query: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
}

// Cart data structures (shared across apps)
export interface CartItem {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  variant?: string;
  imageUrl?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice?: number;
  currency: string;
}

// Generic operation result (shared across apps)
export interface ShoppingOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  website: SiteAdapterNameValues;
}

// API types (shared across apps)
export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  params?: Record<string, string | number | boolean>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

// Chat message types for backend integration
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamRequest {
  messages: ChatMessage[];
  user_id: string;
}

// Utility function to map credentials to API headers
export function mapCredentialsToHeaders<T extends SiteAdapterNameValues>(
  siteAdapter: T,
  credentials: SiteHeadersByAdapter[T]
): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerMapping = SITE_HEADER_MAPPINGS[siteAdapter];
  
  if (!headerMapping || !credentials) {
    return headers;
  }

  // Dynamically iterate through credentials and apply mapping
  Object.entries(credentials).forEach(([key, value]) => {
    if (value && headerMapping[key as keyof typeof headerMapping]) {
      headers[headerMapping[key as keyof typeof headerMapping]] = value;
    }
  });

  return headers;
}
