import type { FeedResponseDto as Feed, PostResponseDto as Post, FindByUserDto } from '@repo/dto';
import { internalClient } from './client';

const DEFAULT_FEED_LIMIT = 12;

/** [GET] 피드 데이터 조회 함수 (커서 페이지네이션) */
export const getFeedPosts = async (cursor?: string, limit = DEFAULT_FEED_LIMIT) => {
  const { data } = await internalClient.get<Feed>('/post/feed', { params: { limit, cursor } });
  return { items: data.posts, hasNext: data.hasNext, nextCursor: data.nextCursor };
};

/** [GET] 특정 사용자 게시물 목록 조회 함수 (커서 페이지네이션) */
export const getUserProfilePosts = async (userId: string, cursor?: string, limit = DEFAULT_FEED_LIMIT) => {
  const { data } = await internalClient.get<FindByUserDto>(`/post/user/${userId}`, { params: { limit, cursor } });
  return { items: data.posts, hasNext: data.hasNext, nextCursor: data.nextCursor };
};

/** [GET] 게시글 상세 조회 (postId만 전달된 경우 모달에서 사용) */
export const getPostDetail = async (postId: string) => {
  const { data } = await internalClient.get<Post>(`/post/${postId}`);
  return data;
};

/** [POST] 게시글 생성 (Post 생성 시 music upsert 후 post_music 생성) */
export const createPost = async (formData: FormData) => {
  await internalClient.post('/post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
