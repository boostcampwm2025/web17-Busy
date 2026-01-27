import { MOCK_YOUTUBE_SEARCH_RESULT } from '@/constants';
import { toErrorMessage } from '@/utils';

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

// dto 또는 type 폴더로 이동 고려
export interface YoutubeVideoResult {
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
    topicId: '/m/04rlf',
    videoCategoryId: '10',
    maxResults: String(limit),
    regionCode: country,
    videoEmbeddable: 'true',
    key: process.env.YOUTUBE_API_KEY!,
  });

  return `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`;
};

export const searchYoutubeVideos = async ({
  keyword,
  limit = DEFAULT_LIMIT,
  country = DEFAULT_COUNTRY,
  signal,
}: SearchYoutubeParams): Promise<YoutubeVideoResult[]> => {
  if (!keyword) return [];
  return MOCK_YOUTUBE_SEARCH_RESULT.items;

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
