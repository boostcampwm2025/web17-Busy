import { internalClient } from './client';
import type { CreateLikeDto, LikedUserDto } from '@repo/dto';

type LikeActionRes = { message?: string; ok?: boolean };

/** [POST] 좋아요 추가 */
export const addLike = async (dto: CreateLikeDto): Promise<LikeActionRes> => {
  const { data } = await internalClient.post<LikeActionRes>('/like', dto);
  return data;
};

/** [DELETE] 좋아요 삭제  */
export const removeLike = async (postId: string): Promise<LikeActionRes> => {
  const { data } = await internalClient.delete<LikeActionRes>(`/like/${postId}`);
  return data;
};

/** [GET] 좋아요 클릭한 사람들 조회 */
export const getLikedUsers = async (postId: string): Promise<LikedUserDto[]> => {
  const { data } = await internalClient.get<LikedUserDto[]>(`/like/${postId}/users`);
  return data;
};
