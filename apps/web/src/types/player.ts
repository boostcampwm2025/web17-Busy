import type { MusicResponseDto as Music } from '@repo/dto';

export interface NowPlayingState {
  currentMusic: Music | null;
  isPlaying: boolean;
}

export interface QueueItem {
  music: Music;
  orderIndex: number;
}

export type PlayerProgress = {
  positionMs: number;
  durationMs: number;
};

export type Playback = PlayerProgress & {
  seekToMs: (ms: number) => void;
};
