import { SiteAdapterName } from './constants.js';

export interface RamiLevyCredentials {
  authorization: string;
  ecomtoken: string;
  cookie: string;
  userId: string;
}

export interface ShufersalCredentials {
  csrftoken: string;
  cookie: string;
}

export type SiteCredentials = {
  [SiteAdapterName.ramiLevy]: RamiLevyCredentials;
  [SiteAdapterName.shufersal]: ShufersalCredentials;
};

export type SiteName = keyof SiteCredentials;
