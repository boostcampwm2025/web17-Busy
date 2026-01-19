// src/api/internal/now-playlist.ts
import { MusicResponseDto as Music } from '@repo/dto';
import { internalClient } from './client';

// [GET] 재생 목록 가져오기
export const getNowPlaylist = async (): Promise<Music[]> => {
  const { data } = await internalClient.get<{ musics: Music[] }>('/nowPlaylist');
  return data.musics;
};

// [PUT] 재생 목록 업데이트 (순서 변경, 추가, 삭제 등)
export const updateNowPlaylist = async (playlist: Music[]): Promise<void> => {
  const musicIds = playlist.map((m) => m.id);
  await internalClient.put('/nowPlaylist', { musicIds });
};
