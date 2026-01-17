import { MusicProvider } from './music-provider.enum';

interface MusicBaseDto {
  trackUri: string;
  provider: MusicProvider;
  albumCoverUrl: string;
  title: string;
  artistName: string;
  durationMs: number;
}

export interface MusicReqDto extends MusicBaseDto {
  id?: string;
}

export interface MusicResDto extends MusicBaseDto {
  id: string;
}
