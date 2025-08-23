export const SiteAdapterName = {
  ramiLevy: "rami-levy",
  shufersal: "shufersal",
} as const;

export type SiteAdapterNameValues = typeof SiteAdapterName[keyof typeof SiteAdapterName];

// Rami Levy header constants
export const RAMI_LEVY_HEADERS = {
  AUTHORIZATION: "authorization",
  COOKIE: "cookie",
  ECOM_TOKEN: "ecomtoken",
  USER_ID: "userId"
};

// Shufersal header constants
export const SHUFERSAL_HEADERS = {
  CSRF_TOKEN: "x-csrf-token",
  COOKIE: "cookie",
};

// Generic site identifier
export const SITE_HEADER = {
  SITE_NAME: "x-site-name",
} as const;