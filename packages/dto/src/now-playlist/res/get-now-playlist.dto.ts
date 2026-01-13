class MusicInfo {
  id: string;
  trackUri: string;
  provider: string;
  title: string;
  artistName: string;
  albumCoverUrl: string;
  durationMs: number;
}

export class GetNowPlaylistResDto {
  music: MusicInfo[];
}
