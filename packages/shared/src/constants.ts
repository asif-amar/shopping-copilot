export const SiteAdapterName = {
  ramiLevy: "rami-levy",
  shufersal: "shufersal",
} as const;

export const SiteAdapterNameList = [
  SiteAdapterName.ramiLevy,
  SiteAdapterName.shufersal,
] as const;

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

// Site credential headers (used for API communication)
export const SITE_CREDENTIAL_HEADERS = {
  SITE_NAME: "x-site-name",
  RAMI_LEVY_AUTHORIZATION: "x-rami-levy-authorization",
  RAMI_LEVY_ECOM_TOKEN: "x-rami-levy-ecom-token", 
  RAMI_LEVY_COOKIE: "x-rami-levy-cookie",
  RAMI_LEVY_USER_ID: "x-rami-levy-user-id",
  SHUFERSAL_CSRF_TOKEN: "x-shufersal-csrf-token",
  SHUFERSAL_COOKIE: "x-shufersal-cookie",
};

// Header mapping: original header names -> API credential header names
export const RAMI_LEVY_HEADER_MAPPING = {
  [RAMI_LEVY_HEADERS.AUTHORIZATION]: SITE_CREDENTIAL_HEADERS.RAMI_LEVY_AUTHORIZATION,
  [RAMI_LEVY_HEADERS.ECOM_TOKEN]: SITE_CREDENTIAL_HEADERS.RAMI_LEVY_ECOM_TOKEN,
  [RAMI_LEVY_HEADERS.COOKIE]: SITE_CREDENTIAL_HEADERS.RAMI_LEVY_COOKIE,
  [RAMI_LEVY_HEADERS.USER_ID]: SITE_CREDENTIAL_HEADERS.RAMI_LEVY_USER_ID,
};

export const SHUFERSAL_HEADER_MAPPING = {
  [SHUFERSAL_HEADERS.CSRF_TOKEN]: SITE_CREDENTIAL_HEADERS.SHUFERSAL_CSRF_TOKEN,
  [SHUFERSAL_HEADERS.COOKIE]: SITE_CREDENTIAL_HEADERS.SHUFERSAL_COOKIE,
};