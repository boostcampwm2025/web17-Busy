'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import type { MusicRequestDto, MusicResponseDto as Music } from '@repo/dto';

import { dedupeById } from '@/utils/dedupe-by-id';
import { usePlaylistsQuery } from './use-playlists-query';
import { useAddMusicsToPlaylistMutation, useCreatePlaylistMutation } from './use-playlist-mutations';

const toMusicRequestDto = (m: Music): MusicRequestDto => ({
  id: m.id,
  trackUri: m.trackUri,
  provider: m.provider,
  albumCoverUrl: m.albumCoverUrl,
  title: m.title,
  artistName: m.artistName,
  durationMs: m.durationMs,
});

type Options = {
  musics: Music[];
  /** 저장(또는 생성+저장)이 성공했을 때 호출된다. 모달을 닫을지는 호출부가 정한다. */
  onSaved: () => void;
};

/** 보관함 플레이리스트를 골라(또는 새로 만들어) musics를 저장한다. */
export const usePlaylistPicker = ({ musics, onSaved }: Options) => {
  const { data: playlists = [], isLoading, isFetching, isError } = usePlaylistsQuery();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createPlaylist = useCreatePlaylistMutation();
  const addMusics = useAddMusicsToPlaylistMutation();
  const isCreating = createPlaylist.isPending;
  const submittingPlaylistId = addMusics.isPending ? addMusics.variables.playlistId : null;

  const canSubmit = musics.length > 0 && !addMusics.isPending && !isCreating;

  useEffect(() => {
    if (isError) setErrorMsg('플레이리스트 목록을 불러오지 못했습니다.');
  }, [isError]);

  const emptyText = useMemo(() => {
    if (isLoading || isFetching || errorMsg) return null;
    return playlists.length === 0 ? '플레이리스트가 없습니다.' : null;
  }, [errorMsg, isFetching, isLoading, playlists.length]);

  const saveToPlaylist = async (playlistId: string) => {
    if (musics.length === 0) return;

    const unique = dedupeById(musics);
    const { addedMusics } = await addMusics.mutateAsync({ playlistId, musics: unique.map(toMusicRequestDto) });

    const addedCount = Array.isArray(addedMusics) ? addedMusics.length : 0;
    if (addedCount === 0) toast.info('이미 플레이리스트에 있는 곡이에요.');
    else toast.success('보관함에 저장했어요.');

    onSaved();
  };

  const handleSelect = async (playlistId: string) => {
    if (!canSubmit) return;

    setErrorMsg(null);

    try {
      await saveToPlaylist(playlistId);
    } catch {
      setErrorMsg('플레이리스트에 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');
      toast.error('저장에 실패했습니다.');
    }
  };

  const handleCreateAndSave = async () => {
    if (!canSubmit) return;

    setErrorMsg(null);

    try {
      const created = await createPlaylist.mutateAsync();
      await saveToPlaylist(created.id);
    } catch {
      setErrorMsg('새 플레이리스트를 만들지 못했습니다.');
      toast.error('플레이리스트 생성에 실패했습니다.');
    }
  };

  return {
    playlists,
    isLoading,
    isFetching,
    errorMsg,
    emptyText,
    canSubmit,
    isCreating,
    submittingPlaylistId,
    handleSelect,
    handleCreateAndSave,
  };
};
