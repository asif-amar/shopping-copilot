export const SiteAdapterName = {
  ramiLevy: "rami-levy",
  shufersal: "shufersal",
} as const;

export type SiteAdapterNameValues = typeof SiteAdapterName[keyof typeof SiteAdapterName];

// Header constants for credential forwarding
export const SITE_CREDENTIAL_HEADERS = {
  // Rami Levy headers
  RAMI_LEVY_AUTHORIZATION: "x-rami-levy-authorization",
  RAMI_LEVY_ECOM_TOKEN: "x-rami-levy-ecom-token", 
  RAMI_LEVY_COOKIE: "x-rami-levy-cookie",
  RAMI_LEVY_USER_ID: "x-rami-levy-user-id",
  
  // Shufersal headers
  SHUFERSAL_CSRF_TOKEN: "x-shufersal-csrf-token",
  SHUFERSAL_COOKIE: "x-shufersal-cookie",
  
  // Generic site identifier
  SITE_NAME: "x-site-name",
} as const;