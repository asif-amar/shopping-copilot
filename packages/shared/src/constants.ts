export const SiteAdapterName = {
  ramiLevy: "rami-levy",
  shufersal: "shufersal",
} as const;

export const SiteAdapterNameList = [
  SiteAdapterName.ramiLevy,
  SiteAdapterName.shufersal,
] as const;

export type SiteAdapterNameValues = typeof SiteAdapterName[keyof typeof SiteAdapterName];

export const RAMI_LEVY_HEADERS = {
  AUTHORIZATION: "authorization",
  COOKIE: "cookie",
  ECOM_TOKEN: "ecomtoken",
  USER_ID: "userId",
};

// Shufersal header constants
export const SHUFERSAL_HEADERS = {
  CSRF_TOKEN: "x-csrf-token",
  COOKIE: "cookie",
};

// Common site credential headers
export const SITE_CREDENTIAL_HEADERS = {
  SITE_NAME: "x-site-name",
};

// Rami Levy credential headers (used for API communication)
export const RAMI_LEVY_CREDENTIAL_HEADERS = {
  AUTHORIZATION: "x-rami-levy-authorization",
  ECOM_TOKEN: "x-rami-levy-ecom-token", 
  COOKIE: "x-rami-levy-cookie",
  USER_ID: "x-rami-levy-user-id",
};

// Shufersal credential headers (used for API communication)
export const SHUFERSAL_CREDENTIAL_HEADERS = {
  CSRF_TOKEN: "x-shufersal-csrf-token",
  COOKIE: "x-shufersal-cookie",
};

// Header mapping: original header names -> API credential header names
export const RAMI_LEVY_HEADER_MAPPING = {
  [RAMI_LEVY_HEADERS.AUTHORIZATION]: RAMI_LEVY_CREDENTIAL_HEADERS.AUTHORIZATION,
  [RAMI_LEVY_HEADERS.ECOM_TOKEN]: RAMI_LEVY_CREDENTIAL_HEADERS.ECOM_TOKEN,
  [RAMI_LEVY_HEADERS.COOKIE]: RAMI_LEVY_CREDENTIAL_HEADERS.COOKIE,
  [RAMI_LEVY_HEADERS.USER_ID]: RAMI_LEVY_CREDENTIAL_HEADERS.USER_ID,
};

export const SHUFERSAL_HEADER_MAPPING = {
  [SHUFERSAL_HEADERS.CSRF_TOKEN]: SHUFERSAL_CREDENTIAL_HEADERS.CSRF_TOKEN,
  [SHUFERSAL_HEADERS.COOKIE]: SHUFERSAL_CREDENTIAL_HEADERS.COOKIE,
};

// Centralized header mapping by site adapter
export const SITE_HEADER_MAPPINGS = {
  [SiteAdapterName.ramiLevy]: RAMI_LEVY_HEADER_MAPPING,
  [SiteAdapterName.shufersal]: SHUFERSAL_HEADER_MAPPING,
} as const;