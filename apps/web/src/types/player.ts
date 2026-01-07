import type { Music } from './music';

export interface NowPlayingState {
  currentMusic: Music | null;
  isPlaying: boolean;
}

export interface QueueItem {
  music: Music;
  orderIndex: number;
}
