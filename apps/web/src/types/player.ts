import type { MusicResponseDto as Music } from '@repo/dto';

export interface NowPlayingState {
  currentMusic: Music | null;
  isPlaying: boolean;
}

export interface QueueItem {
  music: Music;
  orderIndex: number;
}
