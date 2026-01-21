import { internalClient } from './client';
import { CreateFollowDto, DeleteFollowDto, GetUserFollowDto } from '@repo/dto';

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

type FollowActionRes = { ok?: boolean; message?: string };

/** [POST] 팔로우 요청 (BE: POST /follow, body: { otherUserId }) */
export const addFollow = async (otherUserId: string) => {
  const body: CreateFollowDto = { otherUserId };
  const { data } = await internalClient.post<FollowActionRes>('/follow', body);
  return data;
};

/** [DELETE] 팔로우 취소 (BE: DELETE /follow, body: { otherUserId }) */
export const removeFollow = async (otherUserId: string) => {
  const body: DeleteFollowDto = { otherUserId };
  const { data } = await internalClient.delete<FollowActionRes>('/follow', { data: body });
  return data;
};
