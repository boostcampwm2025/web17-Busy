export interface MusicResponse {
  musicId: string;
  title: string;
  artistName: string;
  albumCoverUrl: string;
  trackUri: string;
  durationMs: number;
}

export interface UserResponse {
  userId: string;
  nickname: string;
  profileImgUrl: string;
}

export interface PostResponse {
  postId: string;
  author: UserResponse;
  coverImgUrl: string;
  musics: MusicResponse[];
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isEdited: boolean;
  isLiked: boolean;
}
