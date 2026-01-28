import type { LogEventDto } from '@repo/dto';

const nowIso = () => new Date().toISOString();

/**
 * 상세 모달에서 수집
 * - dwellMs: 머무른 시간
 * - playedMusicCount: 컨텐츠에서 재생한 음악 개수
 * - listenMsByMusic: 음악별 청취시간 { musicId: ms }
 */
export const makePostDetailLog = (params: {
  postId: string;
  dwellMs: number;
  playedMusicCount: number;
  listenMsByMusic: Record<string, number>;
}): LogEventDto => {
  return {
    eventType: 'POST_DETAIL_SUMMARY',
    source: 'fe_ux',
    occurredAt: nowIso(),
    targetPostId: params.postId,
    meta: {
      dwellMs: Math.max(0, Math.round(params.dwellMs)),
      playedMusicCount: Math.max(0, Math.round(params.playedMusicCount)),
      listenMsByMusic: params.listenMsByMusic ?? {},
    },
  };
};

/**
 * 플레이어에서 "보관함에 추가" 로그
 * - archiveAddMusicIds
 */
export const makeArchiveAddMusicLog = (params: { musicIds: string[] }): LogEventDto => {
  const ids = Array.isArray(params.musicIds) ? params.musicIds : [];

  return {
    eventType: 'ARCHIVE_ADD_MUSICS',
    source: 'fe_ux',
    occurredAt: nowIso(),
    meta: { musicIds: ids, count: ids.length },
  };
};

/**
 * 플레이어에서 "포스트로 추가" 로그
 * - postAddMusicIds
 */
export const makePostAddMusicLog = (params: { musicIds: string[] }): LogEventDto => {
  const ids = Array.isArray(params.musicIds) ? params.musicIds : [];

  return {
    eventType: 'POST_ADD_MUSICS',
    source: 'fe_ux',
    occurredAt: nowIso(),
    meta: { musicIds: ids, count: ids.length },
  };
};
