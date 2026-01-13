import type { Music } from './music';

export interface AuthorSummary {
  userId: string;
  nickname: string;
  profileImageUrl: string;
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
}
