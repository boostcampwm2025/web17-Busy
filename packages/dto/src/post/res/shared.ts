import { MusicResponseDto } from '../../music/music.dto';

export interface UserResponse {
  userId: string;
  nickname: string;
  profileImgUrl: string;
}

export interface PostResponse {
  postId: string;
  author: UserResponse;
  coverImgUrl: string;
  musics: MusicResponseDto[];
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isEdited: boolean;
  isLiked: boolean;
}
