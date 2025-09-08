export type AIStyle = "flexible" | "balanced" | "strict";

export interface UserPreferences {
  aiStyle: AIStyle;
  // Future preferences can be added here:
  // language?: "hebrew" | "english";
  // responseLength?: "short" | "medium" | "detailed";
  // autoCartAdd?: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  aiStyle: "balanced",
};