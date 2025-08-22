import { SiteAdapterName, SiteAdapterNameValues } from './constants.js';

export interface RamiLevyCredentials {
  authorization: string;
  ecomtoken: string;
  cookie: string;
  userId: string;
}

export interface ShufersalCredentials {
  csrftoken: string;
  cookie: string;
}

export type SiteCredentials = {
  [SiteAdapterName.ramiLevy]: RamiLevyCredentials;
  [SiteAdapterName.shufersal]: ShufersalCredentials;
};

export type SiteName = keyof SiteCredentials;

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
