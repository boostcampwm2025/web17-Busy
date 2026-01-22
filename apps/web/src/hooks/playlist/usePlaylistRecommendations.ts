'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { GetAllPlaylistsResDto, GetPlaylistDetailResDto } from '@repo/dto';
import { getAllPlaylists, getPlaylistDetail } from '@/api/internal';
import { MOCK_PLAYLIST_BRIEFS, MOCK_PLAYLIST_DETAILS } from '@/constants';

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

const FALLBACK_HINT = '플레이리스트 API 연동 전까지 목업 데이터로 대체합니다. (추후 제거)';

const toFallbackListMessage = (): string => `${toListErrorMessage()} ${FALLBACK_HINT}`;
const toFallbackDetailMessage = (): string => `${toDetailErrorMessage()} ${FALLBACK_HINT}`;

export const usePlaylistRecommendations = ({ enabled }: Options): State => {
  const [status, setStatus] = useState<ListStatus>('idle');
  const [briefs, setBriefs] = useState<PlaylistBrief[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const isFetching = useMemo(() => status === 'loading', [status]);

  const refetch = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const data = await getAllPlaylists();
      setBriefs(data);
      setStatus('success');
    } catch {
      /**
       * TODO(BE): 백엔드 연결 완료 후 아래 fallback 제거
       * - 에러 메시지 정책(토스트/재시도 버튼)을 UI에서 확정
       */
      setBriefs(MOCK_PLAYLIST_BRIEFS);
      setStatus('success');
      setErrorMessage(toFallbackListMessage());
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refetch();
  }, [enabled, refetch]);

  const selectPlaylist = useCallback(async (playlistId: string): Promise<PlaylistDetail | null> => {
    setSelectedPlaylistId(playlistId);

    try {
      const detail = await getPlaylistDetail(playlistId);
      return { id: detail.id, title: detail.title, musics: detail.musics };
    } catch {
      /**
       * TODO(BE): 백엔드 연결 완료 후 아래 fallback 제거
       * - 에러 메시지 정책(토스트/재시도 버튼)을 UI에서 확정
       */
      setErrorMessage(toFallbackDetailMessage());

      const fallback = MOCK_PLAYLIST_DETAILS[playlistId as keyof typeof MOCK_PLAYLIST_DETAILS];
      if (!fallback) return null;

      return { id: fallback.id, title: fallback.title, musics: fallback.musics };
    } finally {
      setSelectedPlaylistId(null);
    }
  }, []);

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
