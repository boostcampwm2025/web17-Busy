import type { QueryClient } from '@tanstack/react-query';
import type { GetPlaylistDetailResDto as PlaylistDetail } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';

type PlaylistDetailPatch = Partial<Pick<PlaylistDetail, 'title' | 'musics'>>;

/**
 * 상세 화면의 낙관적 갱신을 cache에 직접 반영한다.
 * 곡 목록을 로컬 state로 복사해 고치면 재조회가 도착할 때 되돌아가므로 cache를 단일 출처로 둔다.
 */
export const patchPlaylistDetailInCache = (queryClient: QueryClient, playlistId: string, patch: PlaylistDetailPatch) => {
  queryClient.setQueryData<PlaylistDetail>(queryKeys.playlists.detail(playlistId), (current) => {
    if (!current) return current;

    return { ...current, ...patch };
  });
};

/** 낙관적 갱신 직전에 진행 중인 재조회를 멈춘다. 응답이 늦게 도착해 갱신을 덮어쓰는 것을 막는다. */
export const cancelPlaylistDetailQueries = (queryClient: QueryClient, playlistId: string) =>
  queryClient.cancelQueries({ queryKey: queryKeys.playlists.detail(playlistId) });

/** 낙관적 갱신 전 상태. 실패하면 이 값으로 되돌린다. */
export const getPlaylistDetailSnapshot = (queryClient: QueryClient, playlistId: string) =>
  queryClient.getQueryData<PlaylistDetail>(queryKeys.playlists.detail(playlistId));

/**
 * 낙관적 갱신을 되돌린다.
 * cache는 모달을 닫아도 남으므로, 실패한 값을 그대로 두면 다음에 열 때도 보인다.
 */
export const restorePlaylistDetailSnapshot = (queryClient: QueryClient, playlistId: string, snapshot: PlaylistDetail | undefined) => {
  queryClient.setQueryData(queryKeys.playlists.detail(playlistId), snapshot);
};

/** 편집 결과를 서버 값으로 확정한다. 목록의 곡 수·커버도 함께 바뀌므로 상세와 목록을 같이 무효화한다. */
export const invalidatePlaylistCaches = (queryClient: QueryClient, playlistId: string) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.playlists.detail(playlistId) });
};

/**
 * 삭제된 플레이리스트의 상세 cache를 버린다.
 * 삭제 후에는 invalidate하면 안 된다. 구독 중인 화면이 있으면 없어진 플레이리스트를 다시 조회한다.
 */
export const removePlaylistDetailCache = (queryClient: QueryClient, playlistId: string) =>
  queryClient.removeQueries({ queryKey: queryKeys.playlists.detail(playlistId), exact: true });
