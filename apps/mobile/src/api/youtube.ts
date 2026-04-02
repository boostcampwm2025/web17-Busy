export interface YoutubeVideoResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
      default: { url: string };
    };
  };
}

type Params = {
  keyword: string;
  limit?: number;
  signal?: AbortSignal;
};

const ENDPOINT = 'https://www.googleapis.com/youtube/v3/search';
const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

export const searchYoutubeVideos = async ({ keyword, limit = 30, signal }: Params): Promise<YoutubeVideoResult[]> => {
  if (!keyword || !API_KEY) return [];

  const params = new URLSearchParams({
    q: keyword,
    part: 'snippet',
    type: 'video',
    topicId: '/m/04rlf',
    videoCategoryId: '10',
    maxResults: String(limit),
    regionCode: 'KR',
    videoEmbeddable: 'true',
    key: API_KEY,
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { method: 'GET', signal });
  if (!res.ok) throw new Error(`YouTube 검색 오류: ${res.status}`);

  const data = await res.json();
  return Array.isArray(data.items) ? (data.items as YoutubeVideoResult[]) : [];
};
