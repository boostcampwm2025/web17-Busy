import { MOCK_YOUTUBE_SEARCH_RESULT } from '@/constants';
import { toErrorMessage } from '@/utils';
import { YOUTUBE_SEARCH } from '@/constants';

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
    key: process.env.YOUTUBE_SEARCH!,
  });

  return `${YOUTUBE_SEARCH_ENDPOINT}?${params.toString()}`;
};

export const searchYoutubeVideos = async ({
  keyword,
  limit = YOUTUBE_SEARCH.DEFAULT_LIMIT,
  country = YOUTUBE_SEARCH.COUNTRY,
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
