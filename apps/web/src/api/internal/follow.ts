import { internalClient } from './client';
import { GetUserFollowDto } from '@repo/dto';

const DEFAULT_FOLLOW_LIMIT = 10;

/** [GET] 팔로워 사용자 목록 조회 함수 (커서 페이지네이션) */
export const getFollowerUsers = async (userId: string, cursor?: string, limit = DEFAULT_FOLLOW_LIMIT) => {
  const { data } = await internalClient.get<GetUserFollowDto>(`/follow/follower/${userId}`, { params: { limit, cursor } });
  return data;
};

/** [GET] 팔로잉 사용자 목록 조회 함수 (커서 페이지네이션) */
export const getFollowingUsers = async (userId: string, cursor?: string, limit = DEFAULT_FOLLOW_LIMIT) => {
  const { data } = await internalClient.get<GetUserFollowDto>(`/follow/following/${userId}`, { params: { limit, cursor } });
  return data;
};

interface FollowActionRes {
  message: string;
}

/** [POST] 팔로우 요청 함수 */
export const addFollow = async (userId: string) => {
  const { data } = await internalClient.post<FollowActionRes>(`/follow/${userId}`);
  return data;
};

/** [DELETE] 팔로우 취소 요청 함수 */
export const removeFollow = async (userId: string) => {
  const { data } = await internalClient.delete<FollowActionRes>(`/follow/${userId}`);
  return data;
};
