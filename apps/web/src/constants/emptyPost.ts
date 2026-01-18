import type { Post } from '@/types';

export const EMPTY_POST: Post = {
  postId: 'empty',
  author: { userId: '', nickname: '', profileImgUrl: '' },
  coverImgUrl: '',
  content: '',
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date(0).toISOString(),
  musics: [],
  isLiked: false,
  isEdited: false,
};
