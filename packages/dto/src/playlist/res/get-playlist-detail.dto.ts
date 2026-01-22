import { MusicResponseDto } from '../../music';

export class GetPlaylistDetailResDto {
  id: string;
  title: string;
  musics: MusicResponseDto[];
}
