// src/api/internal/now-playlist.ts
import { internalClient } from './client';
import type { Music } from '@/types';

// [GET] 재생 목록 가져오기
export const getNowPlaylist = async (): Promise<Music[]> => {
  const { data } = await internalClient.get<{ music: Music[] }>('/nowPlaylist');
  return data.music;
};

// [PUT] 재생 목록 업데이트 (순서 변경, 추가, 삭제 등)
export const updateNowPlaylist = async (playlist: Music[]): Promise<void> => {
  await internalClient.put('/nowPlaylist', { playlist });
};
