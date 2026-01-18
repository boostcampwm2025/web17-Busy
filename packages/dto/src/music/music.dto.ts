import { MusicProvider } from './music-provider.enum';

interface MusicBaseDto {
  trackUri: string;
  provider: MusicProvider;
  albumCoverUrl: string;
  title: string;
  artistName: string;
  durationMs: number;
}

export interface MusicRequestDto extends MusicBaseDto {
  id?: string;
}

export interface MusicResponseDto extends MusicBaseDto {
  id: string;
}
