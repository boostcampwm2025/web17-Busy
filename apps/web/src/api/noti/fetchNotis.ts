import { internalClient } from '../internal/client';

export async function fetchNotis() {
  const { data } = await internalClient.get('/noti');
  return data;
}

export async function markNotiRead(notiId: string) {
  await internalClient.patch(`/noti/${notiId}`);
}
