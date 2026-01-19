import { FeedResponseDto } from '@repo/dto';
import { internalClient } from './client';

/** [GET] 서버 컴포넌트 전용 피드 초기 데이터 조회 함수 */
export const getInitialFeedPosts = async (limit = 10) => {
  const res = await fetch(`${process.env.INTERNAL_API_URL}/post/feed?limit=${limit}`, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getInitialFeedPosts failed: ${res.status} ${text.slice(0, 200)}`);
  }

  return (await res.json()) as FeedResponseDto;
};

/** [GET] 커서 페이지네이션 기반 피드 데이터 조회 함수 */
export const getFeedPosts = async (cursor?: string, limit = 10) => {
  const { data } = await internalClient.get<FeedResponseDto>('/post/feed', { params: { limit, cursor } });
  return data;
};

export const createPost = async (formData: FormData) => {
  await internalClient.post('/post', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
};
