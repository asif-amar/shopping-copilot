export const SiteAdapterName = {
  ramiLevy: "rami-levy",
  shufersal: "shufersal",
} as const;

export type SiteAdapterNameValues = typeof SiteAdapterName[keyof typeof SiteAdapterName];