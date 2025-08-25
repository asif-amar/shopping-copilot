// Credential types for shopping adapters

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