import { Provider } from './music-provider.enum';

interface MusicBaseDto {
  trackUri: string;
  provider: Provider;
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
