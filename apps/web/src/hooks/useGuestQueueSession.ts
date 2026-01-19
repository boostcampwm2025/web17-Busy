'use client';

import { useEffect, useRef } from 'react';
import type { Music } from '@/types';
import { usePlayerStore } from '@/stores';

const STORAGE_KEY = 'guest_queue_v1';
const SAVE_DEBOUNCE_MS = 500;

type StoredGuestQueue = {
  queue: Music[];
  currentMusic: Music | null;
  isPlaying: boolean;
  savedAt: number;
};

const safeParse = (raw: string): StoredGuestQueue | null => {
  try {
    return JSON.parse(raw) as StoredGuestQueue;
  } catch {
    return null;
  }
};

export const clearGuestQueueSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

/**
 * 게스트(비로그인)일 때만 sessionStorage로 큐/현재곡 상태를 저장/복원합니다.
 * - 탭 독립: sessionStorage 특성상 다른 탭과 공유되지 않음
 */
export const useGuestQueueSession = (enabled: boolean) => {
  const queue = usePlayerStore((s) => s.queue);
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const initializeQueue = usePlayerStore((s) => s.initializeQueue);
  const playMusic = usePlayerStore((s) => s.playMusic);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  // 1) 최초 1회 복원
  useEffect(() => {
    if (!enabled) return;
    if (hydratedRef.current) return;

    hydratedRef.current = true;

    const raw = (() => {
      try {
        return sessionStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    })();

    if (!raw) return;

    const parsed = safeParse(raw);
    if (!parsed) return;

    // queue 복원
    initializeQueue(parsed.queue ?? []);

    // currentMusic 복원: queue에 없으면 playMusic 호출로 append 규칙이 적용될 수 있으니
    // "큐에 있든 없든" 동일하게 재생 대상으로만 잡기 위해 playMusic 사용
    if (parsed.currentMusic) {
      playMusic(parsed.currentMusic);
      // playMusic은 isPlaying=true로 켤 수 있으므로, 저장된 isPlaying이 false면 다시 토글로 맞춤
      if (!parsed.isPlaying) {
        togglePlay();
      }
    }
    // isPlaying이 true면 playMusic에서 이미 true가 됐을 수 있으니 별도 처리 필요 없음
  }, [enabled, initializeQueue, playMusic, togglePlay]);

  // 2) 변경 시 저장(디바운스)
  useEffect(() => {
    if (!enabled) return;
    if (!hydratedRef.current) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      const payload: StoredGuestQueue = {
        queue,
        currentMusic,
        isPlaying,
        savedAt: Date.now(),
      };

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [enabled, queue, currentMusic, isPlaying]);
};
