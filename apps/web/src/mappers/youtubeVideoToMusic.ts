import { YoutubeVideoResult } from '@/api';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';

/** 이스케이프 문자열 디코딩 함수 */
function decodeHtmlEntities(text: string) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent ?? '';
}

export const youtubeVideoToMusic = (video: YoutubeVideoResult): Music => ({
  id: video.id.videoId,
  trackUri: video.id.videoId,
  provider: MusicProvider.YOUTUBE,
  albumCoverUrl: video.snippet.thumbnails.high.url,
  title: decodeHtmlEntities(video.snippet.title),
  artistName: video.snippet.channelTitle,
  durationMs: 0,
});
