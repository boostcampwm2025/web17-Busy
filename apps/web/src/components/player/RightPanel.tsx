'use client';

import { QueueList, MiniPlayerBar, NowPlaying } from './index';
import { useQueueSync, useGuestQueueSession } from '@/hooks';
import { usePlayerStore, useModalStore, MODAL_TYPES, useAuthStore } from '@/stores';
import { useMemo, useCallback } from 'react';

const findCurrentIndex = (currentMusicId: string | null, queueIds: string[]): number => {
  if (!currentMusicId) return -1;
  return queueIds.indexOf(currentMusicId);
};

export default function RightPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const enableServerSync = isAuthenticated && !isLoading;
  const enableGuestSession = !isAuthenticated && !isLoading;

  useQueueSync({ enabled: enableServerSync });
  useGuestQueueSession(enableGuestSession);

  const { openModal, closeModal, isOpen, modalType } = useModalStore();
  const isQueueOpen = isOpen && modalType === MODAL_TYPES.MOBILE_QUEUE;

  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const queue = usePlayerStore((s) => s.queue);

  const playMusic = usePlayerStore((s) => s.playMusic);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const moveUp = usePlayerStore((s) => s.moveUp);
  const moveDown = usePlayerStore((s) => s.moveDown);
  const moveTo = usePlayerStore((s) => s.moveTo);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const playNext = usePlayerStore((s) => s.playNext);

  const queueIds = useMemo(() => queue.map((m) => m.id), [queue]);
  const currentIndex = useMemo(() => findCurrentIndex(currentMusic?.id ?? null, queueIds), [currentMusic?.id, queueIds]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  const handleTogglePlay = useCallback(() => {
    if (!currentMusic) return;
    togglePlay();
  }, [currentMusic, togglePlay]);

  const handleToggleQueue = useCallback(() => {
    if (isQueueOpen) return closeModal();
    openModal(MODAL_TYPES.MOBILE_QUEUE);
  }, [isQueueOpen, closeModal, openModal]);

  return (
    <>
      <MiniPlayerBar
        currentMusic={currentMusic}
        isPlaying={isPlaying}
        canPrev={canPrev}
        canNext={canNext}
        isQueueOpen={isQueueOpen}
        onTogglePlay={handleTogglePlay}
        onPrev={playPrev}
        onNext={playNext}
        onToggleQueue={handleToggleQueue}
      />

      <section className="hidden lg:flex flex-col h-full w-full bg-white">
        <NowPlaying
          currentMusic={currentMusic}
          isPlaying={isPlaying}
          canPrev={canPrev}
          canNext={canNext}
          onTogglePlay={handleTogglePlay}
          onPrev={playPrev}
          onNext={playNext}
        />

        <QueueList
          queue={queue}
          currentMusicId={currentMusic?.id ?? null}
          onClear={clearQueue}
          onRemove={removeFromQueue}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
          onMove={moveTo}
          onSelect={playMusic}
        />
      </section>
    </>
  );
}
