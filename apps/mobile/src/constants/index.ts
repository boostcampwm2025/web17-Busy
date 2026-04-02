export const DEFAULT_IMAGES = {
  PROFILE: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128',
  ALBUM: 'https://placehold.co/400x400?text=Music+Album',
  POST: 'https://placehold.co/600x400?text=Post+Here!',
} as const;

export const ITUNES_SEARCH = {
  DEBOUNCE_MS: 300,
  MIN_QUERY_LENGTH: 2,
  DEFAULT_LIMIT: 20,
  COUNTRY: 'KR' as const,
} as const;

export const YOUTUBE_SEARCH = {
  DEBOUNCE_MS: 500,
  MIN_QUERY_LENGTH: 2,
  DEFAULT_LIMIT: 30,
  COUNTRY: 'KR' as const,
} as const;
