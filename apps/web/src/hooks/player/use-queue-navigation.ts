import { useCallback, useMemo } from 'react';

import { usePlayerStore } from '@/stores/usePlayerStore';

/**
 * 큐 안에서 현재 곡이 어디쯤인지로 이전/다음 가능 여부를 정하고, 재생 컨트롤을 함께 돌려준다.
 * MiniPlayerBar와 NowPlaying이 같은 판단을 써야 해서 어느 한쪽이 아니라 여기에 둔다.
 */
export const useQueueNavigation = () => {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const queue = usePlayerStore((s) => s.queue);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const playNext = usePlayerStore((s) => s.playNext);

  const currentIndex = useMemo(() => {
    if (!currentMusic) return -1;
    return queue.findIndex((music) => music.id === currentMusic.id);
  }, [currentMusic, queue]);

  const handleTogglePlay = useCallback(() => {
    if (!currentMusic) return;
    togglePlay();
  }, [currentMusic, togglePlay]);

  // 반환 객체를 memo하지 않으면 이걸 쓰는 쪽의 useCallback이 매 렌더 새로 만들어져 memo된 자식이 다시 그려진다.
  return useMemo(
    () => ({
      canPrev: currentIndex > 0,
      canNext: currentIndex >= 0 && currentIndex < queue.length - 1,
      togglePlay: handleTogglePlay,
      playPrev,
      playNext,
    }),
    [currentIndex, queue.length, handleTogglePlay, playPrev, playNext],
  );
};
