'use client';

import NowPlaying from './NowPlaying';
import QueueList from './QueueList';
import MiniPlayerBar from './MiniPlayerBar';
import { usePlayerStore } from '@/stores';

export default function RightPanel() {
  const currentMusic = usePlayerStore((state) => state.currentMusic);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const clearQueue = usePlayerStore((state) => state.clearQueue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const moveUp = usePlayerStore((state) => state.moveUp);
  const moveDown = usePlayerStore((state) => state.moveDown);

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

  const handleDisabledPost = () => {
    // TODO(#next): 게시 모달 연동 단계에서 구현
  };

  const handleDisabledSave = () => {
    // TODO(#next): 보관함 저장 연동 단계에서 구현
  };

  const handleDisabledPrev = () => {
    // TODO(#next): 재생 엔진 연동 단계에서 구현
  };

  const handleDisabledNext = () => {
    // TODO(#next): 재생 엔진 연동 단계에서 구현
  };

  return (
    <>
      {/* Mobile: 미니 플레이어 바 */}
      <MiniPlayerBar
        currentMusic={currentMusic}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onPrev={handleDisabledPrev}
        onNext={handleDisabledNext}
        onPost={handleDisabledPost}
        onSave={handleDisabledSave}
      />

      {/* Desktop: 상세 RightPanel */}
      <section className="hidden lg:flex flex-col h-full w-full bg-white">
        <NowPlaying
          currentMusic={currentMusic}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
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
