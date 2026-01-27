import { toErrorMessage } from '@/utils';

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
  signal?: AbortSignal;
};

export const searchYoutubeVideos = async ({ keyword, signal }: SearchYoutubeParams): Promise<YoutubeVideoResult[]> => {
  if (!keyword) return [];

  // next 서버 내부 API 경로로 요청
  const url = `/api/youtube-search?keyword=${encodeURIComponent(keyword)}`;

  const res = await fetch(url, {
    method: 'GET',
    signal,
  });

  if (!res.ok) {
    throw new Error(toErrorMessage(res.status));
  }

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
};
