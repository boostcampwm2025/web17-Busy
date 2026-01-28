import { internalClient } from './client';

export const privacyConsent = async () => {
  await internalClient.post('/privacy');
  return;
};

export const privacyConsentDelete = async () => {
  await internalClient.delete('/privacy');
  return;
};
