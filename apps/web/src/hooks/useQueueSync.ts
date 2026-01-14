import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores';
import { getNowPlaylist, updateNowPlaylist } from '@/api/internal/now-playlist';

export const useQueueSync = () => {
  const queue = usePlayerStore((s) => s.queue);
  const initializeQueue = usePlayerStore((s) => s.initializeQueue);

  const [isLoaded, setIsLoaded] = useState(false);

  // 컴포넌트 마운트 시 최초 1회 실행
  useEffect(() => {
    const fetchInitialQueue = async () => {
      try {
        const serverQueue = await getNowPlaylist();

        initializeQueue(serverQueue);
        setIsLoaded(true);
      } catch (error) {
        console.error('불러오기 실패:', error);
        setIsLoaded(true);
      }
    };

    fetchInitialQueue();
  }, [initializeQueue]);

  // Queue 변경 감지 및 저장 (디바운스 적용)
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(async () => {
      try {
        await updateNowPlaylist(queue);
      } catch (error) {
        console.error('동기화 실패:', error);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [queue, isLoaded]);
};
