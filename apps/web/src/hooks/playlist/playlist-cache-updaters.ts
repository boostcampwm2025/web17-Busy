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

/**
 * 낙관적 갱신이 실패했을 때 서버 값을 다시 읽어 온다.
 * 로컬 state와 달리 cache는 모달을 닫아도 남으므로, 틀린 값을 그대로 두면 다음에 열 때도 보인다.
 */
export const invalidatePlaylistDetailCache = (queryClient: QueryClient, playlistId: string) =>
  queryClient.invalidateQueries({ queryKey: queryKeys.playlists.detail(playlistId) });

/**
 * 삭제된 플레이리스트의 상세 cache를 버린다.
 * 삭제 후에는 invalidate하면 안 된다. 구독 중인 화면이 있으면 없어진 플레이리스트를 다시 조회한다.
 */
export const removePlaylistDetailCache = (queryClient: QueryClient, playlistId: string) =>
  queryClient.removeQueries({ queryKey: queryKeys.playlists.detail(playlistId), exact: true });
