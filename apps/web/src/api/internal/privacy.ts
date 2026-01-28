import { internalClient } from './client';
import { UpdateConsentListDto } from '@repo/dto';

export const privacyConsent = async (dto: UpdateConsentListDto) => {
  await internalClient.post('/privacy', dto);
  return;
};
