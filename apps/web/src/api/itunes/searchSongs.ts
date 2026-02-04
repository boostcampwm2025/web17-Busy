import { toErrorMessage } from '@/utils';

export interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesSongResult[];
}

export interface ItunesSongResult {
  // iTunes 기본 필드
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;

  // 기타 응답 필드
  kind?: string;
  wrapperType?: string;
  collectionName?: string;
}

type SearchItunesSongsParams = {
  keyword: string;
  limit?: number;
  country?: 'KR';
  signal?: AbortSignal;
};

const ITUNES_SEARCH_ENDPOINT = 'https://itunes.apple.com/search';
const DEFAULT_LIMIT = 20;
const DEFAULT_COUNTRY = 'KR' as const;

const buildItunesSearchUrl = (keyword: string, limit: number, country: string): string => {
  const params = new URLSearchParams({
    term: keyword,
    entity: 'song',
    limit: String(limit),
    country,
  });

  return `${ITUNES_SEARCH_ENDPOINT}?${params.toString()}`;
};

/**
 * iTunes Search API 호출 (raw 응답 반환)
 * - 인증 불필요
 * - AbortController(signal) 지원
 */
export const searchItunesSongs = async ({
  keyword,
  limit = DEFAULT_LIMIT,
  country = DEFAULT_COUNTRY,
  signal,
}: SearchItunesSongsParams): Promise<ItunesSearchResponse> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { resultCount: 0, results: [] };
  }

  const url = buildItunesSearchUrl(trimmed, limit, country);

  const res = await fetch(url, {
    method: 'GET',
    signal,
  });

  if (!res.ok) {
    throw new Error(toErrorMessage(res.status));
  }

  const data = (await res.json()) as ItunesSearchResponse;

  return {
    resultCount: Number(data.resultCount ?? 0),
    results: Array.isArray(data.results) ? data.results : [],
  };
};
