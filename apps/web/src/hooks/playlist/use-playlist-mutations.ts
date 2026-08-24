'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GetPlaylistDetailResDto as PlaylistDetail, MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic } from '@repo/dto';

import { addMusicsToPlaylist, changeMusicOrderOfPlaylist, createNewPlaylist, deletePlaylist, editTitleOfPlaylist } from '@/api/internal/playlist';
import { queryKeys } from '@/api/queryKeys';
import {
  cancelPlaylistDetailQueries,
  getPlaylistDetailSnapshot,
  invalidatePlaylistCaches,
  patchPlaylistDetailInCache,
  removePlaylistDetailCache,
  restorePlaylistDetailSnapshot,
} from './playlist-cache-updaters';

type Options = {
  playlistId: string;
};

/** 낙관적 갱신 전 상태. 요청이 실패하면 이 값으로 되돌린다. */
type Context = {
  previousDetail: PlaylistDetail | undefined;
};

/**
 * 곡 목록을 통째로 교체한다. 순서 변경과 선택 삭제가 같은 API를 쓰므로 하나의 mutation으로 둔다.
 * 낙관적으로 목록을 먼저 바꾸고, 실패하면 이전 목록으로 되돌린다.
 */
export const usePlaylistSongsMutation = ({ playlistId }: Options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextSongs: SavedMusic[]) =>
      changeMusicOrderOfPlaylist(
        playlistId,
        nextSongs.map((song) => song.id),
      ),
    onMutate: async (nextSongs) => {
      await cancelPlaylistDetailQueries(queryClient, playlistId);

      const previousDetail = getPlaylistDetailSnapshot(queryClient, playlistId);
      patchPlaylistDetailInCache(queryClient, playlistId, { musics: nextSongs });

      return { previousDetail } satisfies Context;
    },
    onError: (_error, _nextSongs, context) => {
      if (!context) return;

      restorePlaylistDetailSnapshot(queryClient, playlistId, context.previousDetail);
    },
    onSettled: () => {
      invalidatePlaylistCaches(queryClient, playlistId);
    },
  });
};

/**
 * 곡을 추가한다. 서버가 매기는 음악 id가 있어야 목록에 넣을 수 있어 낙관적 갱신을 하지 않는다.
 * 응답이 온 뒤 cache의 현재 목록 뒤에 이어 붙인다.
 */
export const useAddPlaylistSongMutation = ({ playlistId }: Options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (song: UnsavedMusic) => addMusicsToPlaylist(playlistId, [song]),
    onSuccess: ({ addedMusics }) => {
      // 요청 사이에 목록이 바뀌었을 수 있어 렌더 시점 값이 아니라 cache의 현재 목록을 읽는다.
      const current = getPlaylistDetailSnapshot(queryClient, playlistId);
      if (!current) return;

      patchPlaylistDetailInCache(queryClient, playlistId, { musics: [...current.musics, ...addedMusics] });
    },
    onSettled: () => {
      invalidatePlaylistCaches(queryClient, playlistId);
    },
  });
};

/** 제목을 바꾼다. 낙관적으로 먼저 반영하고, 실패하면 이전 제목으로 되돌린다. */
export const useRenamePlaylistMutation = ({ playlistId }: Options) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => editTitleOfPlaylist(playlistId, title),
    onMutate: async (title) => {
      await cancelPlaylistDetailQueries(queryClient, playlistId);

      const previousDetail = getPlaylistDetailSnapshot(queryClient, playlistId);
      patchPlaylistDetailInCache(queryClient, playlistId, { title });

      return { previousDetail } satisfies Context;
    },
    onError: (_error, _title, context) => {
      if (!context) return;

      restorePlaylistDetailSnapshot(queryClient, playlistId, context.previousDetail);
    },
    onSettled: () => {
      invalidatePlaylistCaches(queryClient, playlistId);
    },
  });
};

type DeleteOptions = Options & {
  /** 상세 cache를 버리기 전에 화면을 닫는다. 구독자가 남아 있으면 없어진 플레이리스트를 다시 조회한다. */
  onDeleted: () => void;
};

export const useDeletePlaylistMutation = ({ playlistId, onDeleted }: DeleteOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deletePlaylist(playlistId),
    onSuccess: () => {
      onDeleted();

      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
      removePlaylistDetailCache(queryClient, playlistId);
    },
  });
};

/**
 * 보관함 목록에서 쓴다. 대상이 목록 안에서 정해지므로 playlistId를 호출 시점에 받는다.
 * 목록만 갱신하면 이미 열어 본 상세 cache가 예전 제목으로 남으므로 상세도 함께 정리한다.
 */
export const useRenamePlaylistInListMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, title }: { playlistId: string; title: string }) => editTitleOfPlaylist(playlistId, title),
    onSuccess: (_result, { playlistId, title }) => {
      patchPlaylistDetailInCache(queryClient, playlistId, { title });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
    },
  });
};

export const useDeletePlaylistInListMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(playlistId),
    onSuccess: (_result, playlistId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
      removePlaylistDetailCache(queryClient, playlistId);
    },
  });
};

/** 빈 플레이리스트를 만든다. 응답의 플레이리스트를 이어서 쓰는 호출부가 있어 결과를 그대로 넘긴다. */
export const useCreatePlaylistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createNewPlaylist(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
    },
  });
};

/** 보관함 저장 모달에서 쓴다. 대상 플레이리스트가 저장 시점에 정해지므로 playlistId를 호출 시점에 받는다. */
export const useAddMusicsToPlaylistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, musics }: { playlistId: string; musics: UnsavedMusic[] }) => addMusicsToPlaylist(playlistId, musics),
    onSuccess: (_result, { playlistId }) => {
      invalidatePlaylistCaches(queryClient, playlistId);
    },
  });
};
