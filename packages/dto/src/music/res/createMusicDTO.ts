import { MusicProvider } from '../music-provider.enum';

export class CreateMusicResDto {
  musicId: string;
  trackUri: string;
  provider: MusicProvider;
  albumCoverUrl: string;
  title: string;
  artistName: string;
  durationMs: number;
}
