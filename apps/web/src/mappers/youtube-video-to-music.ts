import { YoutubeVideoResult } from '@/api/youtube/searchVideos';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';

/** 이스케이프 문자열 디코딩 함수 */
function decodeHtmlEntities(text: string) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent ?? '';
}

/** high(480x360)는 어디서도 그 해상도로 쓰지 않아 전송량만 낭비한다. medium(320x180)이면 가장 큰 렌더 크기(≈220px)도 충분히 커버한다. */
export const youtubeVideoToMusic = (video: YoutubeVideoResult): Music => ({
  id: video.id.videoId,
  trackUri: video.id.videoId,
  provider: MusicProvider.YOUTUBE,
  albumCoverUrl: video.snippet.thumbnails.medium.url,
  title: decodeHtmlEntities(video.snippet.title),
  artistName: video.snippet.channelTitle,
  durationMs: 0,
});
