import { internalClient } from './client';
import { GetAllPlaylistsResDto, GetPlaylistDetailResDto } from '@repo/dto';

// 보관함 목록 가져오기 (미리보기)
export const getAllPlaylists = async (): Promise<GetAllPlaylistsResDto['playlists']> => {
  const { data } = await internalClient.get<GetAllPlaylistsResDto>('/playlist');
  return Array.isArray(data.playlists) ? data.playlists : [];
};

// 보관함 플레이리스트 하나 자세한 정보 가져오기 (상세보기)
export const getPlaylistDetail = async (playlistId: string): Promise<GetPlaylistDetailResDto> => {
  const { data } = await internalClient.get<GetPlaylistDetailResDto>(`/playlist/${playlistId}`);
  return data;
};
