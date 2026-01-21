import { internalClient } from './client';
//import { GetUserFollowDto } from '@repo/dto';

// ! 임시 interface, 머지하기 전 삭제
interface GetUserFollowDto {
  users: {
    id: string;
    nickname: string;
    profileImgUrl: string;
    isFollowing: boolean;
  }[];
  hasNext: boolean;
  nextCursor?: string;
}

const DEFAULT_FOLLOW_LIMIT = 10;

/** [GET] 팔로워 사용자 목록 조회 함수 (커서 페이지네이션) */
export const getFollowerUsers = async (userId: string, cursor?: string, limit = DEFAULT_FOLLOW_LIMIT) => {
  //const { data } = await internalClient.get<GetUserFollowDto>(`/follow/follower/${userId}`, { params: { limit, cursor } });
  //return data;
  const users = [
    { id: '1', nickname: '테스트1', profileImgUrl: '', isFollowing: true },
    { id: '2', nickname: '테스트2', profileImgUrl: '', isFollowing: false },
    { id: '3', nickname: '테스트3', profileImgUrl: '', isFollowing: false },
    { id: '4', nickname: '테스트4', profileImgUrl: '', isFollowing: true },
    { id: '5', nickname: '테스트5', profileImgUrl: '', isFollowing: true },
  ];
  return { users, hasNext: false, nextCorsor: undefined };
};

/** [GET] 팔로잉 사용자 목록 조회 함수 (커서 페이지네이션) */
export const getFollowingUsers = async (userId: string, cursor?: string, limit = DEFAULT_FOLLOW_LIMIT) => {
  //const { data } = await internalClient.get<GetUserFollowDto>(`/follow/following/${userId}`, { params: { limit, cursor } });
  //return data;
  const users = [
    { id: '1', nickname: '테스트1', profileImgUrl: '', isFollowing: true },
    { id: '2', nickname: '테스트2', profileImgUrl: '', isFollowing: false },
    { id: '3', nickname: '테스트3', profileImgUrl: '', isFollowing: false },
    { id: '4', nickname: '테스트4', profileImgUrl: '', isFollowing: true },
    { id: '5', nickname: '테스트5', profileImgUrl: '', isFollowing: true },
  ];
  return { users, hasNext: false, nextCorsor: undefined };
};

/** [POST] 팔로우 요청 함수 */
export const addFollow = async (otherUserId: string) => {
  await internalClient.post(`/follow`, { otherUserId });
};

/** [DELETE] 팔로우 취소 요청 함수 */
export const removeFollow = async (otherUserId: string) => {
  await internalClient.delete(`/follow`, { data: { otherUserId } });
};
