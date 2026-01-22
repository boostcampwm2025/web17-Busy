import { MusicResponseDto } from '../../music';
import { UserDto } from '../../user';

export interface PostResponseDto {
  id: string;
  author: UserDto;
  coverImgUrl: string;
  musics: MusicResponseDto[];
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isEdited: boolean;
  isLiked: boolean;
}
