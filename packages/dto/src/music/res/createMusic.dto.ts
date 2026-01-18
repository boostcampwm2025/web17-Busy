import { MusicProvider } from '../music-provider.enum';
import { MusicRequestDto } from '../music.dto';

export class CreateMusicResDto implements MusicRequestDto {
  id: string;
  trackUri: string;
  provider: MusicProvider;
  albumCoverUrl: string;
  title: string;
  artistName: string;
  durationMs: number;
}
