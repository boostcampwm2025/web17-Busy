import type { MusicResponseDto as Music } from '@repo/dto';
import { useState, type DragEvent } from 'react';
import QueueItem from './QueueItem';
import QueueToolbar from './QueueToolbar';

type Props = {
  queue: Music[];
  currentMusicId: string | null;
  onClear: () => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onSelect: (music: Music) => void;
};

export default function QueueList({ queue, currentMusicId, onClear, onRemove, onMoveUp, onMoveDown, onMove, onSelect }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const getDragProps = (index: number) => ({
    draggable: true,
    onDragStart: (event: DragEvent<HTMLLIElement>) => {
      setDragIndex(index);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    },
    onDragOver: (event: DragEvent<HTMLLIElement>) => {
      event.preventDefault();
      setDragOverIndex(index);
      event.dataTransfer.dropEffect = 'move';
    },
    onDrop: (event: DragEvent<HTMLLIElement>) => {
      event.preventDefault();
      const from = dragIndex ?? Number(event.dataTransfer.getData('text/plain'));
      if (!Number.isFinite(from)) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }
      if (from !== index) onMove(from, index);
      setDragIndex(null);
      setDragOverIndex(null);
    },
    onDragEnd: () => {
      setDragIndex(null);
      setDragOverIndex(null);
    },
  });

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-gray-4/30">
      <QueueToolbar queue={queue} onClear={onClear} />

      {queue.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
            <p className="text-sm text-gray-2 mt-1">음악을 추가하면 여기에서 관리할 수 있어요.</p>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
          {queue.map((music, index) => (
            <QueueItem
              key={`${music.id}-${index}`}
              music={music}
              index={index}
              isCurrent={currentMusicId === music.id}
              isDragOver={dragOverIndex === index}
              isFirst={index === 0}
              isLast={index === queue.length - 1}
              dragProps={getDragProps(index)}
              onSelect={onSelect}
              onRemove={onRemove}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
