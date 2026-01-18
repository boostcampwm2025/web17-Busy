import { MusicResponseDto } from '../../music/music.dto';
import { UserResponse, PostResponse } from './shared';

export class GetPostDetailResponseDto implements PostResponse {
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
