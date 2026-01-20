import { MusicResponseDto as Music } from '@repo/dto';

export interface PlaylistBrief {
  id: string;
  title: string;
  tracksCount: number;
  firstAlbumCoverUrl: string;
}

export interface Playlist {
  id: string;
  title: string;
  musics: Music[];
}
