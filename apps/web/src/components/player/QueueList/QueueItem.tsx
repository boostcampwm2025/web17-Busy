import type { MusicResponseDto as Music } from '@repo/dto';
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react';

import TickerText from '@/components/common/TickerText';
import type { DragProps } from '@/hooks/common/use-drag-reorder';

type Props = {
  music: Music;
  index: number;

  isCurrent: boolean;
  isDragOver: boolean;
  isFirst: boolean;
  isLast: boolean;

  dragProps: DragProps;

  onSelect: (music: Music) => void;
  onRemove: (musicId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

export default function QueueItem({
  music,
  index,
  isCurrent,
  isDragOver,
  isFirst,
  isLast,
  dragProps,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const handleSelectClick = () => {
    onSelect(music);
  };

  const handleRemoveClick = () => {
    onRemove(music.id);
  };

  const handleMoveUpClick = () => {
    onMoveUp(index);
  };

  const handleMoveDownClick = () => {
    onMoveDown(index);
  };

  return (
    <li
      {...dragProps}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
        isCurrent ? 'border-primary bg-white' : 'border-transparent hover:border-gray-3 hover:bg-white'
      } ${isDragOver ? 'border-accent-cyan bg-accent-cyan/10' : ''}`}
    >
      <span className="text-gray-2 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </span>
      <span className={`w-6 text-center text-sm font-bold ${isCurrent ? 'text-accent-pink' : 'text-gray-2'}`}>{index + 1}</span>

      <button type="button" onClick={handleSelectClick} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <img src={music.albumCoverUrl} alt={music.title} className="w-10 h-10 rounded border border-gray-3 object-cover" />
        <div className="min-w-0 flex-1">
          <TickerText
            text={music.title}
            className={`text-sm font-bold ${isCurrent ? 'text-accent-pink' : 'text-primary'}`}
            durationSec={10}
            playOnHover
          />

          <TickerText text={music.artistName} className="text-xs text-gray-1" durationSec={10} playOnHover />
        </div>
      </button>

      <div className="flex flex-col">
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
