'use client';

import { useState } from 'react';
import { QueueList, MiniPlayerBar, MobileQueueModal, NowPlaying } from './index';
import { usePlayerStore } from '@/stores';
import { useSpotifySDK } from './useSpotifySDK';

const findCurrentIndex = (currentMusicId: string | null, queueIds: string[]): number => {
  if (!currentMusicId) {
    return -1;
  }
  return queueIds.indexOf(currentMusicId);
};

export default function RightPanel() {
  useSpotifySDK();
  const [isMobileQueueOpen, setIsMobileQueueOpen] = useState(false);

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

  const queueIds = queue.map((m) => m.musicId);
  const currentIndex = findCurrentIndex(currentMusic?.musicId ?? null, queueIds);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  const handleTogglePlay = () => {
    if (!currentMusic) {
      return;
    }
    togglePlay();
  };

  const handleClearQueue = () => {
    clearQueue();
  };

  const handleRemoveFromQueue = (musicId: string) => {
    removeFromQueue(musicId);
  };

  const handleMoveUp = (index: number) => {
    moveUp(index);
  };

  const handleMoveDown = (index: number) => {
    moveDown(index);
  };

  const handlePrev = () => {
    playPrev();
  };

  const handleNext = () => {
    playNext();
  };

  const handleToggleQueue = () => {
    setIsMobileQueueOpen((prev) => !prev);
  };

  const handleCloseMobileQueue = () => {
    setIsMobileQueueOpen(false);
  };

  const handlePlayFromQueue = (music: (typeof queue)[number]) => {
    playMusic(music);
  };

  const handleDisabledPost = () => {
    // TODO(#next): 게시 모달 연동 단계에서 구현
  };

  const handleDisabledSave = () => {
    // TODO(#next): 보관함 저장 연동 단계에서 구현
  };

  const handleDisabledShuffle = () => {
    // TODO(#next): 재생 엔진 연동 단계에서 구현
  };

  const handleDisabledRepeat = () => {
    // TODO(#next): 재생 엔진 연동 단계에서 구현
  };

  return (
    <>
      <MiniPlayerBar
        currentMusic={currentMusic}
        isPlaying={isPlaying}
        canPrev={canPrev}
        canNext={canNext}
        isQueueOpen={isMobileQueueOpen}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleQueue={handleToggleQueue}
        onPost={handleDisabledPost}
        onSave={handleDisabledSave}
      />

      <MobileQueueModal
        isOpen={isMobileQueueOpen}
        queue={queue}
        currentMusicId={currentMusic?.musicId ?? null}
        onClose={handleCloseMobileQueue}
        onClear={handleClearQueue}
        onPlay={handlePlayFromQueue}
        onRemove={handleRemoveFromQueue}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      <section className="hidden lg:flex flex-col h-full w-full bg-white">
        <NowPlaying
          currentMusic={currentMusic}
          isPlaying={isPlaying}
          canPrev={canPrev}
          canNext={canNext}
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
          currentMusicId={currentMusic?.musicId ?? null}
          onClear={handleClearQueue}
          onRemove={handleRemoveFromQueue}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      </section>
    </>
  );
}
