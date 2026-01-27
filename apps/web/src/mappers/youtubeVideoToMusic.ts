import { YoutubeVideoResult } from '@/api/youtube/searchVideos';
import { MusicProvider, type MusicResponseDto as Music } from '@repo/dto';

export const youtubeVideoToMusic = (m: YoutubeVideoResult): Music => ({
  id: m.id.videoId,
  trackUri: m.id.videoId,
  provider: MusicProvider.YOUTUBE,
  albumCoverUrl: m.snippet.thumbnails.high.url,
  title: m.snippet.title,
  artistName: m.snippet.channelTitle,
  durationMs: 0,
});
