'use client';

import type { Music } from '@/types';
import { ChevronDown, ChevronUp, Trash2, XCircle } from 'lucide-react';
import { useMemo } from 'react';

interface QueueListProps {
  queue: Music[];
  currentMusicId: string | null;

  onClear: () => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

interface QueueListItemProps {
  music: Music;
  index: number;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function QueueListItem({ music, index, isCurrent, isFirst, isLast, onRemove, onMoveUp, onMoveDown }: QueueListItemProps) {
  const handleRemoveClick = () => {
    onRemove(music.musicId);
  };

  const handleMoveUpClick = () => {
    onMoveUp(index);
  };

  const handleMoveDownClick = () => {
    onMoveDown(index);
  };

  return (
    <li
      className={`flex items-center gap-3 p-2 rounded-lg border ${
        isCurrent ? 'border-primary bg-gray-4' : 'border-transparent hover:border-gray-3 hover:bg-gray-4'
      }`}
    >
      <span className={`w-6 text-center text-xs font-bold ${isCurrent ? 'text-accent-pink' : 'text-gray-2'}`}>{index + 1}</span>

      <img src={music.albumCoverUrl} alt={music.title} className="w-10 h-10 rounded border border-gray-3 object-cover shrink-0" />

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold truncate ${isCurrent ? 'text-primary' : 'text-darkblue'}`}>{music.title}</p>
        <p className="text-xs text-gray-1 truncate">{music.artistName}</p>
      </div>

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleMoveUpClick}
          disabled={isFirst}
          title="위로"
          className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleMoveDownClick}
          disabled={isLast}
          title="아래로"
          className="p-1 text-gray-1 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <button type="button" onClick={handleRemoveClick} title="삭제" className="p-2 text-gray-2 hover:text-accent-pink">
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

export default function QueueList({ queue, currentMusicId, onClear, onRemove, onMoveUp, onMoveDown }: QueueListProps) {
  const isEmpty = queue.length === 0;

  const handleClearClick = () => {
    if (isEmpty) {
      return;
    }
    onClear();
  };

  const items = useMemo(() => queue, [queue]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-primary uppercase tracking-wider text-sm">Queue</h3>

        <button
          type="button"
          onClick={handleClearClick}
          disabled={isEmpty}
          title={isEmpty ? '큐가 비어있습니다' : '전체 비우기'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-primary text-primary font-bold text-xs
                     hover:bg-gray-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          Clear
        </button>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
          <p className="font-bold text-gray-1">재생목록이 비어있습니다.</p>
          <p className="text-sm text-gray-2">음악을 추가하면 여기에서 관리할 수 있어요.</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-2 pr-1">
          {items.map((music, index) => (
            <QueueListItem
              key={music.musicId}
              music={music}
              index={index}
              isCurrent={currentMusicId === music.musicId}
              isFirst={index === 0}
              isLast={index === items.length - 1}
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
