'use client';

import NowPlaying from './NowPlaying';
import QueueList from './QueueList';
import { usePlayerStore } from '@/stores';

export default function RightPanel() {
  const currentMusic = usePlayerStore((state) => state.currentMusic);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);

  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const moveUp = usePlayerStore((state) => state.moveUp);
  const moveDown = usePlayerStore((state) => state.moveDown);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  const handleTogglePlay = () => {
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
    // TODO(#next): CreatePostModal 연동 단계에서 구현
  };

  const handleDisabledSave = () => {
    // TODO(#next): 보관함/플레이리스트 저장 연동 단계에서 구현
  };

  return (
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
  );
}
