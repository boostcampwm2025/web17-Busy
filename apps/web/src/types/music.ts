export type MusicProvider = 'SPOTIFY' | 'APPLE' | 'YOUTUBE' | 'LOCAL';

export interface Music {
  /** DB: music.music_id */
  musicId: string;

  /** DB: music.track_uri */
  trackUri: string;

  /** DB: music.provider */
  provider?: MusicProvider;

  /** DB: music.album_cover_url */
  albumCoverUrl: string;

  /** DB: music.title */
  title: string;

  /** DB: music.artist_name */
  artistName: string;

  /** DB: music.duration_ms */
  durationMs: number;
}
