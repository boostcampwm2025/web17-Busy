import { FeedResponseDto as Feed, PostResponseDto as Post } from '@repo/dto';
import { internalClient } from './client';

const DEFAULT_FEED_LIMIT = 10;

/** [GET] 서버 컴포넌트 전용 피드 초기 데이터 조회 함수 */
export const getInitialFeedPosts = async (limit = DEFAULT_FEED_LIMIT) => {
  const res = await fetch(`${process.env.INTERNAL_API_URL}/post/feed?limit=${limit}`, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getInitialFeedPosts failed: ${res.status} ${text.slice(0, 200)}`);
  }

  return (await res.json()) as Feed;
};

/** [GET] 커서 페이지네이션 기반 피드 데이터 조회 함수 */
export const getFeedPosts = async (cursor?: string, limit = DEFAULT_FEED_LIMIT) => {
  const { data } = await internalClient.get<Feed>('/post/feed', { params: { limit, cursor } });
  return data;
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
