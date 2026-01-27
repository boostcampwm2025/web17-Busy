import { YoutubeVideoResult } from '@/api';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';

/** 이스케이프 문자열 디코딩 함수 */
function decodeHtmlEntities(text: string) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent ?? '';
}

export const youtubeVideoToMusic = (m: YoutubeVideoResult): Music => ({
  id: m.id.videoId,
  trackUri: m.id.videoId,
  provider: MusicProvider.YOUTUBE,
  albumCoverUrl: m.snippet.thumbnails.high.url,
  title: decodeHtmlEntities(m.snippet.title),
  artistName: m.snippet.channelTitle,
  durationMs: 0,
});
