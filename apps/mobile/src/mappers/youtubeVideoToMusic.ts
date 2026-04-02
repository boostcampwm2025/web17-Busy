import type { YoutubeVideoResult } from '@/src/api/youtube';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';

// DOMParser가 없는 RN 환경용 HTML 엔티티 디코딩
const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

export const youtubeVideoToMusic = (video: YoutubeVideoResult): Music => ({
  id: video.id.videoId,
  trackUri: video.id.videoId,
  provider: MusicProvider.YOUTUBE,
  albumCoverUrl: video.snippet.thumbnails.high?.url ?? video.snippet.thumbnails.medium?.url ?? '',
  title: decodeHtmlEntities(video.snippet.title),
  artistName: video.snippet.channelTitle,
  durationMs: 0,
});
