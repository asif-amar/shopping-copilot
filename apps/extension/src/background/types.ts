export interface InterceptEndpoint {
  urlPattern: string;
  method: string;
}

export interface RequestHeader {
  name: string;
  aliases: string[];
}

export interface WebsiteConfig {
  name: string;
  siteAdapter: string;
  urlPatterns: string[];
  interceptEndpoints: InterceptEndpoint[];
  requestHeaders: RequestHeader[];
  requiresCookies: boolean;
  storageKey: string;
}