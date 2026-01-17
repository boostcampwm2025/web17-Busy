import { MusicProvider } from '../music-provider.enum';
import { MusicReqDto } from '../music.dto';

export class CreateMusicResDto implements MusicReqDto {
  id: string;
  trackUri: string;
  provider: MusicProvider;
  albumCoverUrl: string;
  title: string;
  artistName: string;
  durationMs: number;
}
