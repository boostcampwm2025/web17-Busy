export interface MusicRequest {
  musicId?: string;
  title: string;
  artistName: string;
  albumCoverUrl: string;
  trackUri: string;
  provider?: string;
  durationMs: number;
}

export class CreatePostRequestDto {
  musics: MusicRequest[];
  content: string;
  coverImgUrl?: string;
}
