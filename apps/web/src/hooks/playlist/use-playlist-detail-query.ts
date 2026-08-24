'use client';

import { useQuery } from '@tanstack/react-query';

import { getPlaylistDetail } from '@/api/internal/playlist';
import { queryKeys } from '@/api/queryKeys';

/**
 * 플레이리스트 상세 조회. `usePlaylistRecommendations`가 `fetchQuery`로 채워 둔 같은 key를 구독하므로
 * 드롭다운에서 먼저 열어 본 플레이리스트는 캐시에서 바로 그려진다.
 */
export const usePlaylistDetailQuery = (playlistId: string) =>
  useQuery({
    queryKey: queryKeys.playlists.detail(playlistId),
    queryFn: () => getPlaylistDetail(playlistId),
    enabled: Boolean(playlistId),
  });
