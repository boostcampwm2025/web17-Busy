import { describe, expect, it } from 'vitest';
import type { YoutubeVideoResult } from '@/api/youtube/searchVideos';

import { youtubeVideoToMusic } from './youtube-video-to-music';

const video = (overrides: Partial<YoutubeVideoResult['snippet']> = {}): YoutubeVideoResult => ({
  kind: 'youtube#searchResult',
  etag: 'etag',
  id: { kind: 'youtube#video', videoId: 'abc123' },
  snippet: {
    publishedAt: '2026-01-01T00:00:00Z',
    channelId: 'channel-1',
    title: '영상 제목',
    description: '',
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/abc123/default.jpg', width: 120, height: 90 },
      medium: { url: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg', width: 320, height: 180 },
      high: { url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg', width: 480, height: 360 },
    },
    channelTitle: '채널',
    liveBroadcastContent: 'none',
    publishTime: '2026-01-01T00:00:00Z',
    ...overrides,
  },
});

describe('youtubeVideoToMusic', () => {
  it('썸네일은 high가 아니라 medium을 쓴다', () => {
    const music = youtubeVideoToMusic(video());

    expect(music.albumCoverUrl).toBe('https://i.ytimg.com/vi/abc123/mqdefault.jpg');
  });

  it('제목의 HTML 엔티티를 디코딩한다', () => {
    const music = youtubeVideoToMusic(video({ title: 'Rock &amp; Roll' }));

    expect(music.title).toBe('Rock & Roll');
  });

  it('videoId를 id와 trackUri로 쓴다', () => {
    const music = youtubeVideoToMusic(video());

    expect(music.id).toBe('abc123');
    expect(music.trackUri).toBe('abc123');
  });
});
