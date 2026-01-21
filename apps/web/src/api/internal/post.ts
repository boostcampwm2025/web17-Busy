import { FeedResponseDto as Feed, PostResponseDto as Post } from '@repo/dto';
import { internalClient } from './client';
import { MOCK_PROFILE_POSTS } from '@/constants';

const DEFAULT_FEED_LIMIT = 12;

/** [GET] 피드 데이터 조회 함수 (커서 페이지네이션) */
export const getFeedPosts = async (cursor?: string, limit = DEFAULT_FEED_LIMIT) => {
  const { data } = await internalClient.get<Feed>('/post/feed', { params: { limit, cursor } });
  return { items: data.posts, hasNext: data.hasNext, nextCursor: data.nextCursor };
};

/** [GET] 특정 사용자 게시물 목록 조회 함수 (커서 페이지네이션) */
export const getUserProfilePosts = async (userId: string, cursor?: string, limit = DEFAULT_FEED_LIMIT) => {
  return { items: MOCK_PROFILE_POSTS, hasNext: true, nextCursor: undefined }; // TODO: 실제 API 연동
};

/** [GET] 게시글 상세 조회 (postId만 전달된 경우 모달에서 사용) */
export const getPostDetail = async (postId: string) => {
  const { data } = await internalClient.get<Post>(`/post/${postId}`);
  return data;
};

export const createPost = async (formData: FormData) => {
  await internalClient.post('/post', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
};
