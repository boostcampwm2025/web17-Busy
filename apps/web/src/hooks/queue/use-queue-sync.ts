'use client';

import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { getNowPlaylist, updateNowPlaylist } from '@/api/internal/now-playlist';

type Options = { enabled: boolean };

/**
 * 로그인 사용자의 큐를 서버(`nowPlaylist`)와 동기화한다.
 * 게스트용 `useGuestQueueSession`과 저장 대상(queue만) · 저장소(서버) · 복원 시점(enabled 켜질 때마다) ·
 * 실패 정책(서버 에러 시 이후 sync 전체 중단)이 전부 달라 하나로 합치지 않았다.
 */
export const useQueueSync = ({ enabled }: Options) => {
  const queue = usePlayerStore((s) => s.queue);
  const initializeQueue = usePlayerStore((s) => s.initializeQueue);

  const [isLoaded, setIsLoaded] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);

  // enabled가 false면 서버와 완전 분리
  useEffect(() => {
    if (!enabled) {
      setIsLoaded(false);
      setSyncEnabled(true);
      return;
    }

    const fetchInitialQueue = async () => {
      try {
        const serverQueue = await getNowPlaylist();
        initializeQueue(serverQueue);
      } catch {
        // 실패 시 sync 중단(백엔드 미구현/에러 폭주 방지)
        setSyncEnabled(false);
      } finally {
        setIsLoaded(true);
      }
    };

    void fetchInitialQueue();
  }, [enabled, initializeQueue]);

  useEffect(() => {
    if (!enabled || !isLoaded || !syncEnabled) return;

    const timer = setTimeout(async () => {
      try {
        await updateNowPlaylist(queue);
      } catch {
        // 실패 시 sync 중단(반복 에러 방지)
        setSyncEnabled(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [enabled, queue, isLoaded, syncEnabled]);
};
