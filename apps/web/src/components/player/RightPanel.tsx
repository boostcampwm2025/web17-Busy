'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { QueueList, MiniPlayerBar, NowPlaying } from './index';
import { useQueueSync, useGuestQueueSession } from '@/hooks';
import { usePlayerStore, useModalStore, MODAL_TYPES, useAuthStore } from '@/stores';

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

  const selectMusic = usePlayerStore((s) => s.selectMusic);
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

  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const isFullPlayerOpenRef = useRef(isFullPlayerOpen);
  isFullPlayerOpenRef.current = isFullPlayerOpen;

  // 뒤로가기 / ESC 로 닫기
  useEffect(() => {
    if (isFullPlayerOpen) history.pushState({ vibrFullPlayer: true }, '');
  }, [isFullPlayerOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (isFullPlayerOpenRef.current) setIsFullPlayerOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullPlayerOpenRef.current) setIsFullPlayerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // 스와이프 다운으로 닫기
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if ((e.touches[0]?.clientY ?? 0) - touchStartY.current > 80) {
      setIsFullPlayerOpen(false);
    }
  };

  const section = (
    <section
      className={
        isFullPlayerOpen
          ? 'lg:hidden flex flex-col bg-white fixed inset-0 z-[10001] animate-slide-up'
          : 'hidden lg:flex flex-col h-full w-full bg-white'
      }
      onTouchStart={isFullPlayerOpen ? handleTouchStart : undefined}
      onTouchMove={isFullPlayerOpen ? handleTouchMove : undefined}
    >
      {isFullPlayerOpen && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-gray-3" />
          <div className="flex-1 flex justify-end">
            <button
              type="button"
              onClick={() => setIsFullPlayerOpen(false)}
              className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
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
          onSelect={selectMusic}
        />
      </div>
    </section>
  );

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
        onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
      />

      {section}
    </>
  );
}
