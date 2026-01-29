'use client';

import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores';
import { getNowPlaylist, updateNowPlaylist } from '@/api/internal/now-playlist';

type Options = { enabled: boolean };

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
