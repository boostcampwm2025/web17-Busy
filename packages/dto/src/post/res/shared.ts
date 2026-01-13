export interface MusicResponse {
  musicId: string;
  title: string;
  artistName: string;
  albumCoverUrl: string;
  trackUri: string;
}

export interface UserResponse {
  userId: string;
  nickname: string;
  profileImgUrl?: string;
}

export interface PostResponse {
  postId: string;
  author: UserResponse;
  thumbnailImgUrl: string;
  musics: MusicResponse[];
  content: string;
  likeCount: number;
  commentCount: number;
  createAt: Date;
  isEdited: boolean;
  isLiked: boolean;
}
