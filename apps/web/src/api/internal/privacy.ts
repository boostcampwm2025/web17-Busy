import { internalClient } from './client';
import { GetRecentConsentListDto, UpdateConsentListDto } from '@repo/dto';

export const updatePrivacyConsent = async (dto: UpdateConsentListDto) => {
  await internalClient.post('/privacy', dto);
  return;
};

export const getRecentConsents = async () => {
  const { data } = await internalClient.get<GetRecentConsentListDto>('/privacy');
  return data;
};
