import type { Music } from './music';

export interface AuthorSummary {
  userId: string;
  nickname: string;
  profileImgUrl: string;
}

export interface Post {
  postId: string;
  author: AuthorSummary;

  coverImgUrl: string;
  content: string;

  likeCount: number;
  commentCount: number;

  /** ISO string (ex: new Date().toISOString()) */
  createdAt: string;

  musics: Music[];

  isEdited: boolean;
  isLiked: boolean;
}
