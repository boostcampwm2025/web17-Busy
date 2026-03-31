import type { FeedResponseDto as Feed, PostResponseDto as Post, FindByUserDto, Cursor } from '@repo/dto';
import { internalClient } from './client';

const DEFAULT_FEED_LIMIT = 12;

/** [GET] 피드 데이터 조회 함수 (커서 페이지네이션) */
export const getFeedPosts = async (cursors?: Cursor, limit = DEFAULT_FEED_LIMIT) => {
  const { data } = await internalClient.get<Feed>('/feed', {
    params: { limit, followingCursor: cursors?.following, trendingCursor: cursors?.trending, recentCursor: cursors?.recent },
  });
  return data;
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

/** [DELETE] 게시글 삭제 */
export const deletePost = async (postId: string) => {
  await internalClient.delete(`/post/${postId}`);
};

/** [PATCH] 게시글 수정 (content만 수정) */
export const updatePost = async (postId: string, data: { content: string }) => {
  await internalClient.patch(`/post/${postId}`, data);
};
