import { Provider } from '@repo/dto';

export interface Music {
  /** DB: music.music_id */
  musicId: string;

  /** DB: music.track_uri */
  trackUri: string;

  /** DB: music.provider */
  provider?: Provider;

  /** DB: music.album_cover_url */
  albumCoverUrl: string;

  /** DB: music.title */
  title: string;

  /** DB: music.artist_name */
  artistName: string;

  /** DB: music.duration_ms */
  durationMs: number;
}
