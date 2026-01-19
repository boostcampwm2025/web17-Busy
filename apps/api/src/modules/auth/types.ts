export enum AuthProvider {
  SPOTIFY = 'spotify',
  GOOGLE = 'google',
}

export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
};

export type SpotifyCurrentUserResponse = {
  country: string;
  display_name: string;
  email: string;
  explicit_content: object;
  external_urls: { spotify: string };
  follower: { href: string | null; total: number };
  href: string;
  id: string;
  images: { url: string; height: number | null; width: number | null }[];
  product: string;
  type: string;
  uri: string;
};

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
  id_token?: string;
};

export type GoogleUserInfoResponse = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};
