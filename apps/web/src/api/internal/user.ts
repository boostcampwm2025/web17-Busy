import { internalClient } from './client';
import type { GetUserDto as Profile, SearchUsersResDto } from '@repo/dto';

/** [GET] 사용자 프로필 정보 요청 */
export const getUser = async (userId: string): Promise<Profile> => {
  const { data } = await internalClient.get<Profile>(`/user/${userId}`);
  return data;
};

/** [GET] 사용자 검색 (cursor 기반) */
export const searchUsers = async (q: string, cursor?: string, limit?: number): Promise<SearchUsersResDto> => {
  const { data } = await internalClient.get<SearchUsersResDto>('/user/search', {
    params: { q: q.trim(), cursor, limit },
  });
  return data;
};

/** [PATCH] 닉네임 수정 */
export const updateNickname = async (userId: string, nickname: string): Promise<Profile> => {
  const { data } = await internalClient.patch<Profile>(`/user/${userId}`, { nickname });
  return data;
};

/** [PATCH] Bio(설명) 수정 */
export const updateBio = async (userId: string, bio: string): Promise<Profile> => {
  const { data } = await internalClient.patch<Profile>(`/user/${userId}`, { bio });
  return data;
};
