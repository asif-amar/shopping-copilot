export type FeatureType = 'feature' | 'improvement' | 'bugfix' | 'security';

export interface ChangelogFeature {
  type: FeatureType;
  title: string;
  description: string;
}

export interface VersionChangelog {
  version: string;
  releaseDate: string;
  features: {
    en: ChangelogFeature[];
    he: ChangelogFeature[];
  };
}

export interface ChangelogData {
  versions: VersionChangelog[];
}