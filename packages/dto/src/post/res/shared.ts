import { MusicResDto } from '../../music/music.dto';

export interface UserResponse {
  userId: string;
  nickname: string;
  profileImgUrl: string;
}

export interface PostResponse {
  postId: string;
  author: UserResponse;
  coverImgUrl: string;
  musics: MusicResDto[];
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  isEdited: boolean;
  isLiked: boolean;
}

export type ClientPostResponse = Omit<PostResponse, 'createdAt'> & { createdAt: string };
