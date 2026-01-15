export interface SpotifyImage {
  url: string;
}

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyAlbum {
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

interface SpotifySearchTracksResponse {
  tracks?: {
    items?: SpotifyTrack[];
  };
}

type SearchSpotifyTracksParams = {
  query: string;
  token: string;
  market: 'KR';
  limit: number;
  offset: number;
  signal?: AbortSignal;
};

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const SPOTIFY_SEARCH_ENDPOINT = `${SPOTIFY_API_BASE_URL}/search`;

const buildSearchUrl = (params: Omit<SearchSpotifyTracksParams, 'token' | 'signal'>): string => {
  const searchParams = new URLSearchParams({
    q: params.query,
    type: 'track',
    market: params.market,
    limit: String(params.limit),
    offset: String(params.offset),
  });

  return `${SPOTIFY_SEARCH_ENDPOINT}?${searchParams.toString()}`;
};

const toErrorMessage = (status: number, retryAfter?: string | null): string => {
  if (status === 401) return 'Spotify 인증이 필요합니다. 다시 로그인 해주세요.';
  if (status === 403) return 'Spotify 요청 권한이 없습니다.';
  if (status === 429) {
    const waitSec = retryAfter ? `${retryAfter}초` : '잠시';
    return `요청이 너무 많습니다. ${waitSec} 후 다시 시도해주세요.`;
  }
  return 'Spotify 검색 요청에 실패했습니다.';
};

export const searchSpotifyTracks = async ({ query, token, market, limit, offset, signal }: SearchSpotifyTracksParams): Promise<SpotifyTrack[]> => {
  const url = buildSearchUrl({ query, market, limit, offset });

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!res.ok) {
    const retryAfter = res.headers.get('Retry-After');
    throw new Error(toErrorMessage(res.status, retryAfter));
  }

  const data = (await res.json()) as SpotifySearchTracksResponse;
  return data.tracks?.items ?? [];
};
