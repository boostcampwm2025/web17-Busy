import type { PostResponseDto } from '@repo/dto';

export const EMPTY_POST: PostResponseDto = {
  id: 'empty',
  author: { id: '', nickname: '', profileImgUrl: '' },
  coverImgUrl: '',
  content: '',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date(0).toISOString(),
  musics: [],
  isLiked: false,
  isEdited: false,
};
