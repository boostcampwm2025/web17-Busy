interface MusicRequest {
  musicId?: string;
  title: string;
  artistName: string;
  albumCoverUrl: string;
  trackUri: string;
  provider?: string;
}

export class CreatePostRequestDto {
  musics: MusicRequest[];
  content: string;
  thumbnailImgUrl?: string;
}
