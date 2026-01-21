import { internalClient } from './client';
import type { GetUserDto } from '@repo/dto';
import type { SearchUsersResDto } from '@repo/dto';

/** [GET] 사용자 프로필 정보 요청 */
export const getUser = async (userId: string): Promise<GetUserDto> => {
  const { data } = await internalClient.get<GetUserDto>(`/user/${userId}`);
  return data;
};

export const searchUsers = async (q: string): Promise<SearchUsersResDto> => {
  const encoded = encodeURIComponent(q.trim());
  const { data } = await internalClient.get<SearchUsersResDto>(`/user/search?q=${encoded}`);
  return data;
};
