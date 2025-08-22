export interface RamiLevyCredentials {
  authorization: string;
  ecomtoken: string;
  cookie: string;
}

export interface ShufersalCredentials {
  csrftoken: string;
  cookie: string;
}

import { SiteAdapterName } from './constants.js';

export type SiteCredentials = {
  [SiteAdapterName.ramiLevy]: RamiLevyCredentials;
  [SiteAdapterName.shufersal]: ShufersalCredentials;
};

export type SiteName = keyof SiteCredentials;
