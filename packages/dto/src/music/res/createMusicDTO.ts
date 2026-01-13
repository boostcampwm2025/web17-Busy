import { Provider } from '../music-provider.enum';

export class CreateMusicResDto {
  id: string;
  trackUri: string;
  provider: Provider;
  albumCoverUrl: string;
  title: string;
  artistName: string;
  durationMs: number;
}
