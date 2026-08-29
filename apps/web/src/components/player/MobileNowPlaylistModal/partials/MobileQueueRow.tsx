import type { MusicResponseDto as Music } from '@repo/dto';
import { Trash2 } from 'lucide-react';

import { usePlayerStore } from '@/stores/usePlayerStore';
import QueueReorderControls from '../../QueueReorderControls';

type Props = {
  music: Music;
  index: number;
  isLast: boolean;
};

export default function MobileQueueRow({ music, index, isLast }: Props) {
  const isCurrent = usePlayerStore((s) => s.currentMusic?.id === music.id);
  const playMusic = usePlayerStore((s) => s.playMusic);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  const handlePlayClick = () => {
    playMusic(music);
  };

  const handleRemoveClick = () => {
    removeFromQueue(music.id);
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

      <QueueReorderControls index={index} isLast={isLast} />

      <button type="button" onClick={handleRemoveClick} title="삭제" className="p-2 text-gray-2 hover:text-accent-pink">
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
