import { MusicResDto } from '../../music/music.dto';
import { UserResponse, PostResponse } from './shared';

export class GetPostDetailResponseDto implements PostResponse {
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
