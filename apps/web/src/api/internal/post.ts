import { ClientFeedResponseDto } from '@repo/dto';
import { internalClient } from './client';

/** [GET] 서버 컴포넌트 전용 피드 초기 데이터 조회 함수 */
export const getInitialFeedPosts = async (limit = 10) => {
  const res = await fetch(`${process.env.API_BASE_URL}/post/feed?limit=${limit}`, { cache: 'no-store' });
  return res.json() as Promise<ClientFeedResponseDto>;
};

/** [GET] 커서 페이지네이션 기반 피드 데이터 조회 함수 */
export const getFeedPosts = async (cursor?: string, limit = 10) => {
  const { data } = await internalClient.get<ClientFeedResponseDto>('/post/feed', { params: { limit, cursor } });
  return data;
};
