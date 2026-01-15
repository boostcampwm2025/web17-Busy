import { internalClient } from './client';

export async function logout() {
  await internalClient.post('/auth/logout');
}
