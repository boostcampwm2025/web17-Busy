'use client';

import { useState } from 'react';
import { QueueList, MiniPlayerBar, NowPlaying } from './index';
import { useItunesHook, useQueueSync } from '@/hooks';
import { usePlayerStore, useModalStore, MODAL_TYPES } from '@/stores';

const findCurrentIndex = (currentMusicId: string | null, queueIds: string[]): number => {
  if (!currentMusicId) return -1;
  return queueIds.indexOf(currentMusicId);
};

export default function RightPanel() {
  useQueueSync();
  const { positionMs, durationMs } = useItunesHook();
  const { openModal, closeModal, isOpen, modalType } = useModalStore();
  const isQueueOpen = isOpen && modalType === MODAL_TYPES.MOBILE_QUEUE;

  const currentMusic = usePlayerStore((state) => state.currentMusic);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);

  const playMusic = usePlayerStore((state) => state.playMusic);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const moveUp = usePlayerStore((state) => state.moveUp);
  const moveDown = usePlayerStore((state) => state.moveDown);
  const playPrev = usePlayerStore((state) => state.playPrev);
  const playNext = usePlayerStore((state) => state.playNext);

  const queueIds = queue.map((m) => m.id);
  const currentIndex = findCurrentIndex(currentMusic?.id ?? null, queueIds);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  const handleTogglePlay = () => {
    if (!currentMusic) return;
    togglePlay();
  };

  const handleClearQueue = () => clearQueue();
  const handleRemoveFromQueue = (musicId: string) => removeFromQueue(musicId);
  const handleMoveUp = (index: number) => moveUp(index);
  const handleMoveDown = (index: number) => moveDown(index);
  const handlePrev = () => playPrev();
  const handleNext = () => playNext();

  const handleToggleQueue = () => {
    if (isQueueOpen) {
      closeModal();
      return;
    }
    openModal(MODAL_TYPES.MOBILE_QUEUE);
  };

  const handlePlayFromQueue = (music: (typeof queue)[number]) => {
    playMusic(music);
  };

  const handleDisabledPost = () => {};
  const handleDisabledSave = () => {};
  const handleDisabledShuffle = () => {};
  const handleDisabledRepeat = () => {};

  return (
    <>
      <MiniPlayerBar
        currentMusic={currentMusic}
        isPlaying={isPlaying}
        canPrev={canPrev}
        canNext={canNext}
        isQueueOpen={isQueueOpen}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleQueue={handleToggleQueue}
        onPost={handleDisabledPost}
        onSave={handleDisabledSave}
      />

      <section className="hidden lg:flex flex-col h-full w-full bg-white">
        <NowPlaying
          currentMusic={currentMusic}
          isPlaying={isPlaying}
          canPrev={canPrev}
          canNext={canNext}
          positionMs={positionMs}
          durationMs={durationMs}
          onTogglePlay={handleTogglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onShuffle={handleDisabledShuffle}
          onRepeat={handleDisabledRepeat}
          onPost={handleDisabledPost}
          onSave={handleDisabledSave}
        />

        <QueueList
          queue={queue}
          currentMusicId={currentMusic?.id ?? null}
          onClear={handleClearQueue}
          onRemove={handleRemoveFromQueue}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onSelect={handlePlayFromQueue}
        />
      </section>
    </>
  );
}
