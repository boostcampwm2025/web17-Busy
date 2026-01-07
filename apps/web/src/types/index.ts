export interface Music {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  musics: Music[];
  coverUrl?: string;
  description?: string;
}
