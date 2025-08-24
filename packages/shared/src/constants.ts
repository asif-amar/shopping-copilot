export const SiteAdapterName = {
  ramiLevy: "rami-levy",
  shufersal: "shufersal",
} as const;

export type SiteAdapterNameValues =
  (typeof SiteAdapterName)[keyof typeof SiteAdapterName];

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

// Rami Levy header constants
export const RAMI_LEVY_CREDENTIALS = {
  AUTHORIZATION: "x-rami-levy-authorization",
  COOKIE: "x-rami-levy-cookie",
  ECOM_TOKEN: "x-rami-levy-ecom-token",
  USER_ID: "x-rami-levy-user-id",
};

// Shufersal header constants
export const SHUFERSAL_CREDENTIALS = {
  CSRF_TOKEN: "x-shufersal-csrf-token",
  COOKIE: "x-shufersal-cookie",
};
