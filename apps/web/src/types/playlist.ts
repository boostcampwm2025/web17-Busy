import { MusicResponseDto as Music } from '@repo/dto';

export interface Playlist {
  playlistId: string;
  title: string;
  musics: Music[];
}
