import { MOCK_PROFILE } from '@/constants';
import { internalClient } from './client';

/** [GET] 사용자 프로필 정보 요청 */
export const getUserProfileInfo = async (userId: string) => {
  //const { data } = await internalClient.get(`/user/${userId}`);
  return MOCK_PROFILE; // TODO: 실제 API 연동
};
