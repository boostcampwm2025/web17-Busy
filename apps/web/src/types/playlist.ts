import { MusicResponseDto } from '@repo/dto';

export interface Playlist {
  playlistId: string;
  title: string;
  musics: MusicResponseDto[];
}
