import { internalClient } from './client';
import type { GetUserDto as Profile } from '@repo/dto';
import type { SearchUsersResDto } from '@repo/dto';

/** [GET] 사용자 프로필 정보 요청 */
export const getUser = async (userId: string): Promise<Profile> => {
  const { data } = await internalClient.get<Profile>(`/user/${userId}`);
  return data;
};

export const searchUsers = async (q: string): Promise<SearchUsersResDto> => {
  const encoded = encodeURIComponent(q.trim());
  const { data } = await internalClient.get<SearchUsersResDto>(`/user/search?q=${encoded}`);
  return data;
};
