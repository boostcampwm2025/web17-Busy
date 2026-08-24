'use client';

import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic } from '@repo/dto';
import { useState } from 'react';

import { moveTo, reorder } from '@/utils/reorder';
import { useAddPlaylistSongMutation, usePlaylistSongsMutation } from './use-playlist-mutations';

type Options = {
  playlistId: string;
  songs: SavedMusic[];
  onReorderError: () => void;
  onAddError: () => void;
};

/**
 * 곡 목록 편집(선택·삭제·순서·추가). 낙관적 반영과 실패 시 롤백은 mutation이 담당하므로
 * 여기서는 바뀐 목록만 넘기고, 목록이 그대로면 서버 요청 자체를 건너뛴다.
 */
export const usePlaylistSongsEditing = ({ playlistId, songs, onReorderError, onAddError }: Options) => {
  const { mutate: replaceSongs } = usePlaylistSongsMutation({ playlistId });
  const { mutate: addSongMutation } = useAddPlaylistSongMutation({ playlistId });

  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());

  const requestChangeOrder = (nextSongs: SavedMusic[]) => {
    if (nextSongs === songs) return;

    replaceSongs(nextSongs, { onError: onReorderError });
  };

  const toggleSelectSong = (songId: string) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);

      return next;
    });
  };

  const deleteSelectedSongs = () => {
    const nextSongs = songs.filter((song) => !selectedSongIds.has(song.id));
    setSelectedSongIds(new Set());

    requestChangeOrder(nextSongs);
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    requestChangeOrder(reorder(songs, index, direction));
  };

  const moveSongTo = (from: number, to: number) => {
    requestChangeOrder(moveTo(songs, from, to));
  };

  const addSong = (song: UnsavedMusic) => {
    addSongMutation(song, { onError: onAddError });
  };

  return { selectedSongIds, toggleSelectSong, deleteSelectedSongs, moveSong, moveSongTo, addSong };
};
