import { internalClient } from './client';
import type { PlaylistResDto, GetAllPlaylistsResDto, GetPlaylistDetailResDto, MusicRequestDto, AddMusicsToPlaylistResDto } from '@repo/dto';

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

// 새로운 플리 추가
export const createNewPlaylist = async (): Promise<PlaylistResDto> => {
  const { data } = await internalClient.post<PlaylistResDto>('/playlist');
  return data;
};

// 플리 제목 수정
export const editTitleOfPlaylist = async (playlistId: string, title: string): Promise<{ ok: true }> => {
  const { data } = await internalClient.patch<{ ok: true }>(`/playlist/${playlistId}`, { title });
  return data;
};

// 플리 삭제
export const deletePlaylist = async (playlistId: string): Promise<{ ok: true }> => {
  const { data } = await internalClient.delete<{ ok: true }>(`/playlist/${playlistId}`);
  return data;
};

// 플리에 음악 추가
export const addMusicsToPlaylist = async (playlistId: string, musics: MusicRequestDto[]): Promise<AddMusicsToPlaylistResDto> => {
  const { data } = await internalClient.post<AddMusicsToPlaylistResDto>(`/playlist/${playlistId}/music`, { musics });
  return data;
};

// 플리 음악 순서 변경
export const changeMusicOrderOfPlaylist = async (playlistId: string, musicIds: string[]): Promise<{ ok: true }> => {
  const { data } = await internalClient.put<{ ok: true }>(`/playlist/${playlistId}/music`, { musicIds });
  return data;
};
