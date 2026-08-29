import type { MusicResponseDto as Music } from '@repo/dto';
import { GripVertical, Trash2 } from 'lucide-react';

import TickerText from '@/components/common/TickerText';
import type { DragProps } from '@/hooks/common/use-drag-reorder';
import { usePlayerStore } from '@/stores/usePlayerStore';
import QueueReorderControls from '../QueueReorderControls';

type Props = {
  music: Music;
  index: number;
  isLast: boolean;

  isDragOver: boolean;
  dragProps: DragProps;
};

export default function QueueItem({ music, index, isLast, isDragOver, dragProps }: Props) {
  const isCurrent = usePlayerStore((s) => s.currentMusic?.id === music.id);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  const handleSelectClick = () => {
    selectMusic(music);
  };

  const handleRemoveClick = () => {
    removeFromQueue(music.id);
  };

  return (
    <li
      {...dragProps}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
        isCurrent ? 'border-primary bg-white' : 'border-transparent hover:border-gray-3 hover:bg-white'
      } ${isDragOver ? 'border-accent-cyan bg-accent-cyan/10' : ''}`}
    >
      <span className="text-gray-2 cursor-grab active:cursor-grabbing" aria-label="drag-handle">
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

      <QueueReorderControls index={index} isLast={isLast} />

      <button type="button" onClick={handleRemoveClick} title="삭제" className="p-2 text-gray-2 hover:text-accent-pink">
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
