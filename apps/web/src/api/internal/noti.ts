import { internalClient } from './client';
import type { NotiResponseDto } from '@repo/dto';

export async function fetchNotis(): Promise<NotiResponseDto[]> {
  const { data } = await internalClient.get('/noti');
  return data;
}

export async function markNotiRead(notiId: string) {
  await internalClient.patch(`/noti/${notiId}`);
}

export async function markAllNotiRead() {
  await internalClient.patch('/noti');
}

export async function deleteAllNotis() {
  await internalClient.delete('/noti');
}
