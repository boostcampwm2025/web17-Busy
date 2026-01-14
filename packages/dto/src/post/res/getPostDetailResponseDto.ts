import { MusicResponse, UserResponse, PostResponse } from './shared';

export class GetPostDetailResponseDto implements PostResponse {
  postId: string;
  author: UserResponse;
  thumbnailImgUrl: string;
  musics: MusicResponse[];
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  isEdited: boolean;
  isLiked: boolean;
}
