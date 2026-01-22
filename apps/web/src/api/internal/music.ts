import { internalClient } from './client';
import type { CreateMusicResDto, CreateMusicReqDto } from '@repo/dto';

/** [POST] 음악 추가 */
export const createMusic = async (dto: CreateMusicReqDto): Promise<CreateMusicResDto> => {
  const { data } = await internalClient.post<CreateMusicResDto>('/music', dto);
  return data;
};
