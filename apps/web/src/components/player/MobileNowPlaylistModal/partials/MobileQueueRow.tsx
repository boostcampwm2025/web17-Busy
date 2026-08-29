import type { MusicResponseDto as Music } from '@repo/dto';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

import { usePlayerStore } from '@/stores/usePlayerStore';

type Props = {
  music: Music;
  index: number;
  isLast: boolean;
};

export default function MobileQueueRow({ music, index, isLast }: Props) {
  const isCurrent = usePlayerStore((s) => s.currentMusic?.id === music.id);
  const playMusic = usePlayerStore((s) => s.playMusic);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const moveUp = usePlayerStore((s) => s.moveUp);
  const moveDown = usePlayerStore((s) => s.moveDown);

  const handlePlayClick = () => {
    playMusic(music);
  };

  const handleRemoveClick = () => {
    removeFromQueue(music.id);
  };

  const handleMoveUpClick = () => {
    moveUp(index);
  };

  const handleMoveDownClick = () => {
    moveDown(index);
  };

  return (
    <li className={`flex items-center gap-3 p-3 rounded-xl border-2 ${isCurrent ? 'border-primary bg-gray-4' : 'border-transparent bg-white'}`}>
      <span className={`w-6 text-center text-sm font-bold ${isCurrent ? 'text-accent-pink' : 'text-gray-2'}`}>{index + 1}</span>

      <button type="button" onClick={handlePlayClick} className="flex items-center gap-3 min-w-0 flex-1 text-left">
        <img src={music.albumCoverUrl} alt={music.title} className="w-10 h-10 rounded border border-gray-3 object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary truncate">{music.title}</p>
          <p className="text-xs font-bold text-gray-1 truncate">{music.artistName}</p>
        </div>
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          onClick={handleMoveUpClick}
          disabled={index === 0}
          title="위로"
          className="p-1 text-gray-1 enabled:hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleMoveDownClick}
          disabled={isLast}
          title="아래로"
          className="p-1 text-gray-1 enabled:hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
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
