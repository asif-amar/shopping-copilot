import {
  SiteAdapterName,
  SiteAdapterNameValues,
} from "@shopping-copilot/shared";

/**
 * Maps website hostnames to their corresponding site adapters
 */
export const HOSTNAME_TO_ADAPTER_MAP: Record<string, SiteAdapterNameValues> = {
  // Rami Levy
  "www.rami-levy.co.il": SiteAdapterName.ramiLevy,
  "rami-levy.co.il": SiteAdapterName.ramiLevy,

  // Shufersal
  "www.shufersal.co.il": SiteAdapterName.shufersal,
  "shufersal.co.il": SiteAdapterName.shufersal,
  "online.shufersal.co.il": SiteAdapterName.shufersal,
};

/**
 * Get the appropriate site adapter for a given hostname
 */
export function getSiteAdapterFromHostname(
  hostname: string
): SiteAdapterNameValues | null {
  return HOSTNAME_TO_ADAPTER_MAP[hostname] || null;
}

/**
 * Check if a hostname is supported for shopping
 */
export function isShoppingSite(hostname: string): boolean {
  return hostname in HOSTNAME_TO_ADAPTER_MAP;
}

/**
 * Get display name for a site adapter
 */
export function getSiteDisplayName(
  adapter: SiteAdapterNameValues,
  language: string
): string {
  switch (adapter) {
    case SiteAdapterName.ramiLevy:
      return language === "he" ? "רמי לוי" : "Rami Levy";
    case SiteAdapterName.shufersal:
      return language === "he" ? "שופרסל" : "Shufersal";
    default:
      return adapter;
  }
}
