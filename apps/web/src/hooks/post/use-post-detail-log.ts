'use client';

import { useCallback, useEffect, useRef } from 'react';
import { enqueuePostDetailSummary } from './post-detail-log';

const LISTEN_TICK_MS = 1000;

type Params = {
  enabled: boolean;
  postId?: string;
  /** `/api/logs`가 AuthGuard라 비로그인 열람은 기록하지 않는다. */
  userId?: string | null;
  postMusicIds: string[];
  isPlaying: boolean;
  currentMusicId: string | null;
};

type Session = {
  openedAt: number;
  lastTickAt: number;
  playedMusicIds: Set<string>;
  listenMsByMusic: Record<string, number>;
};

/**
 * 상세 모달 열람 요약을 열람 1회당 정확히 1건 기록한다.
 *
 * 시작과 기록을 한 effect에 묶고 의존성을 `enabled`/`postId`로만 둔다.
 * 둘을 나누거나 의존성에 함수·객체를 넣으면 열람이 끝나지 않았는데 cleanup이 돌아,
 * 기록 시점과 열람 종료 시점이 어긋난다.
 */
export function usePostDetailLog({ enabled, postId, userId, postMusicIds, isPlaying, currentMusicId }: Params) {
  const sessionRef = useRef<Session | null>(null);

  // 기록 시점에 최신 값이 필요하지만 의존성에 넣으면 cleanup이 앞당겨 발화한다.
  const latestRef = useRef({ userId, postMusicIds, isPlaying, currentMusicId });
  useEffect(() => {
    latestRef.current = { userId, postMusicIds, isPlaying, currentMusicId };
  });

  useEffect(() => {
    if (!enabled || !postId) return;

    const startedAt = Date.now();
    const session: Session = { openedAt: startedAt, lastTickAt: startedAt, playedMusicIds: new Set(), listenMsByMusic: {} };
    sessionRef.current = session;

    return () => {
      sessionRef.current = null;
      // 열람 도중 로그인 확인이 끝났을 수 있어 종료 시점 값을 본다.
      if (!latestRef.current.userId) return;

      enqueuePostDetailSummary({
        postId,
        dwellMs: Date.now() - session.openedAt,
        playedMusicCount: session.playedMusicIds.size,
        listenMsByMusic: session.listenMsByMusic,
      });
    };
  }, [enabled, postId]);

  useEffect(() => {
    if (!enabled || !postId) return;

    const timer = window.setInterval(() => {
      const session = sessionRef.current;
      if (!session) return;

      const now = Date.now();
      const elapsed = now - session.lastTickAt;
      session.lastTickAt = now;

      const { userId: viewerId, postMusicIds: musicIds, isPlaying: playing, currentMusicId: musicId } = latestRef.current;
      if (!viewerId || !playing || !musicId) return;
      // 이 게시글에 담긴 곡을 재생 중일 때만 누적한다.
      if (!musicIds.includes(musicId)) return;

      session.listenMsByMusic[musicId] = (session.listenMsByMusic[musicId] ?? 0) + Math.max(0, elapsed);
    }, LISTEN_TICK_MS);

    return () => window.clearInterval(timer);
  }, [enabled, postId]);

  const markMusicPlayed = useCallback((musicId: string) => {
    sessionRef.current?.playedMusicIds.add(musicId);
  }, []);

  return { markMusicPlayed };
}
