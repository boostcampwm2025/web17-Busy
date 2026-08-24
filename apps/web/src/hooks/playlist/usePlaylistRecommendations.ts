'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { GetAllPlaylistsResDto, GetPlaylistDetailResDto } from '@repo/dto';
import { getPlaylistDetail } from '@/api/internal/playlist';
import { queryKeys } from '@/api/queryKeys';
import { usePlaylistsQuery } from './use-playlists-query';

export type PlaylistBrief = GetAllPlaylistsResDto['playlists'][number];
export type PlaylistDetail = Pick<GetPlaylistDetailResDto, 'id' | 'title' | 'musics'>;

type ListStatus = 'idle' | 'loading' | 'success';

type Options = {
  /**
   * 추천 영역이 활성화될 때만 true로 넘긴다.
   * 예: "드롭다운 열림 + 검색어 없음" 상태에서만 로드
   */
  enabled: boolean;
};

type State = {
  status: ListStatus;
  briefs: PlaylistBrief[];
  errorMessage: string | null;

  isFetching: boolean;
  selectedPlaylistId: string | null;

  refetch: () => Promise<void>;
  selectPlaylist: (playlistId: string) => Promise<PlaylistDetail | null>;
};

const toListErrorMessage = (): string => '플레이리스트를 불러오지 못했습니다.';
const toDetailErrorMessage = (): string => '플레이리스트 상세를 불러오지 못했습니다.';

export const usePlaylistRecommendations = ({ enabled }: Options): State => {
  const queryClient = useQueryClient();
  const playlistsQuery = usePlaylistsQuery({ enabled });
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const briefs = useMemo(() => playlistsQuery.data ?? [], [playlistsQuery.data]);

  const status = useMemo<ListStatus>(() => {
    if (!enabled) return 'idle';
    if (playlistsQuery.isLoading || (playlistsQuery.isFetching && briefs.length === 0)) return 'loading';
    return 'success';
  }, [briefs.length, enabled, playlistsQuery.isFetching, playlistsQuery.isLoading]);

  const errorMessage = useMemo(() => {
    if (playlistsQuery.isError) return toListErrorMessage();
    return detailErrorMessage;
  }, [detailErrorMessage, playlistsQuery.isError]);

  const isFetching = useMemo(() => playlistsQuery.isFetching, [playlistsQuery.isFetching]);

  const refetch = useCallback(async () => {
    setDetailErrorMessage(null);
    await playlistsQuery.refetch();
  }, [playlistsQuery]);

  const selectPlaylist = useCallback(
    async (playlistId: string): Promise<PlaylistDetail | null> => {
      setSelectedPlaylistId(playlistId);
      setDetailErrorMessage(null);

      try {
        const detail = await queryClient.fetchQuery({
          queryKey: queryKeys.playlists.detail(playlistId),
          queryFn: () => getPlaylistDetail(playlistId),
        });

        return { id: detail.id, title: detail.title, musics: detail.musics };
      } catch {
        setDetailErrorMessage(toDetailErrorMessage());
        return null;
      } finally {
        setSelectedPlaylistId(null);
      }
    },
    [queryClient],
  );

  return {
    status,
    briefs,
    errorMessage,
    isFetching,
    selectedPlaylistId,
    refetch,
    selectPlaylist,
  };
};
