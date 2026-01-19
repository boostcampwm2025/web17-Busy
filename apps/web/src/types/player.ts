import { MusicResponseDto } from '@repo/dto';

export interface NowPlayingState {
  currentMusic: MusicResponseDto | null;
  isPlaying: boolean;
}

export interface QueueItem {
  music: MusicResponseDto;
  orderIndex: number;
}
