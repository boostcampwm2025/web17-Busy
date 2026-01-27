interface YoutubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YoutubeVideoResult[];
}

interface YoutubeVideoResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
        width: number;
        height: number;
      };
      medium: {
        url: string;
        width: number;
        height: number;
      };
      high: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

type SearchYoutubeParams = {
  keyword: string;
  limit?: number;
  country?: 'KR';
  signal?: AbortSignal;
};

const YOUTUBE_SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const DEFAULT_LIMIT = 10;
const DEFAULT_COUNTRY: 'KR' = 'KR';

const buildYoutubeSearchUrl = (keyword: string, limit: number, country: string): string => {
  const params = new URLSearchParams({
    q: keyword,
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    maxResults: String(limit),
    regionCode: country,
    videoEmbeddable: 'true',
    key: process.env.YOUTUBE_API_KEY!,
  });

  return `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`;
};

const toErrorMessage = (status: number): string => {
  if (status >= 500) return '서버 오류가 발생했습니다.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (status === 400) return '검색 요청 형식이 올바르지 않습니다.';
  return '검색 요청에 실패했습니다.';
};

export const searchYoutubeVideos = async ({
  keyword,
  limit = DEFAULT_LIMIT,
  country = DEFAULT_COUNTRY,
  signal,
}: SearchYoutubeParams): Promise<YoutubeVideoResult[]> => {
  if (!keyword) return [];

  const url = buildYoutubeSearchUrl(keyword, limit, country);

  const res = await fetch(url, {
    method: 'GET',
    signal,
  });

  if (!res.ok) {
    throw new Error(toErrorMessage(res.status));
  }

  const data = (await res.json()) as YoutubeSearchResponse;

  return Array.isArray(data.items) ? data.items : [];
};
