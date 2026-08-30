import { describe, expect, it } from 'vitest';
import type { ItunesSongResult } from '@/api/itunes/searchSongs';

import { itunesSongToMusic } from './itunes-song-to-music';

const track = (overrides: Partial<ItunesSongResult> = {}): ItunesSongResult => ({
  trackId: 1,
  trackName: '노래',
  artistName: '가수',
  artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/cover-100x100bb.jpg',
  previewUrl: 'https://example.com/preview.mp3',
  trackTimeMillis: 180000,
  ...overrides,
});

describe('itunesSongToMusic', () => {
  it('artworkUrl100의 100x100bb를 400x400bb로 바꾼다', () => {
    const music = itunesSongToMusic(track());

    expect(music.albumCoverUrl).toBe('https://is1-ssl.mzstatic.com/image/thumb/cover-400x400bb.jpg');
  });

  it('artworkUrl100이 없으면 대체 이미지를 쓴다', () => {
    const music = itunesSongToMusic(track({ artworkUrl100: undefined }));

    expect(music.albumCoverUrl).toContain('placeholder');
  });

  it('previewUrl을 trackUri로 쓴다', () => {
    const music = itunesSongToMusic(track({ previewUrl: 'https://example.com/a.mp3' }));

    expect(music.trackUri).toBe('https://example.com/a.mp3');
  });
});
