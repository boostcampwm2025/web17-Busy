export interface ItunesSongResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  kind?: string;
  wrapperType?: string;
  collectionName?: string;
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesSongResult[];
}

type Params = {
  keyword: string;
  limit?: number;
  country?: 'KR';
  signal?: AbortSignal;
};

const ENDPOINT = 'https://itunes.apple.com/search';

export const searchItunesSongs = async ({ keyword, limit = 20, country = 'KR', signal }: Params): Promise<ItunesSearchResponse> => {
  const trimmed = keyword.trim();
  if (!trimmed) return { resultCount: 0, results: [] };

  const params = new URLSearchParams({
    term: trimmed,
    entity: 'song',
    limit: String(limit),
    country,
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { method: 'GET', signal });
  if (!res.ok) throw new Error(`iTunes 검색 오류: ${res.status}`);

  const data = (await res.json()) as ItunesSearchResponse;
  return {
    resultCount: Number(data.resultCount ?? 0),
    results: Array.isArray(data.results) ? data.results : [],
  };
};
