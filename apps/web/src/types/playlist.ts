import type { Music } from './music';

export interface Playlist {
  playlistId: string;
  title: string;
  musics: Music[];
}
