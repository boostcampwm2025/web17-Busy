import type { MusicResponseDto } from '@repo/dto';
import { CheckSquare, GripVertical, Play, Square } from 'lucide-react';

import TickerText from '@/components/common/TickerText';
import type { DragProps } from '@/hooks/common/use-drag-reorder';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { ReorderControls } from './ReorderControls';

type Props = {
  song: MusicResponseDto;
  index: number;
  isLast: boolean;
  isChecked: boolean;
  isDragOver: boolean;
  toggleSelectSong: (musicId: string) => void;
  moveSong: (index: number, direction: 'up' | 'down') => void;
  dragProps: DragProps;
};

export function SongItem({ song, index, isLast, isChecked, isDragOver, toggleSelectSong, moveSong, dragProps }: Props) {
  const playMusic = usePlayerStore((s) => s.playMusic);

  return (
    <li
      {...dragProps}
      className={`group flex items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors ${
        isDragOver ? 'border-accent-cyan bg-accent-cyan/10' : ''
      }`}
    >
      <span className="mr-2 text-gray-300 cursor-grab active:cursor-grabbing" aria-label="drag-handle">
        <GripVertical className="w-4 h-4" />
      </span>

      <button onClick={() => toggleSelectSong(song.id)} className="mr-3 text-gray-300 hover:text-primary transition-colors">
        {isChecked ? <CheckSquare className="w-5 h-5 text-accent-pink" /> : <Square className="w-5 h-5" />}
      </button>

      {/* 곡 정보를 누르면 그 곡만 재생한다 */}
      <div className="flex items-center flex-1 min-w-0 cursor-pointer" onClick={() => playMusic(song)}>
        <div className="relative w-10 h-10 mr-3 shrink-0">
          <img src={song.albumCoverUrl} alt="cover" loading="lazy" className="w-full h-full rounded border border-gray-200 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded flex items-center justify-center transition-colors">
            <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 fill-current drop-shadow-md" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <TickerText text={song.title} className="text-sm font-bold text-primary" />
          <TickerText text={song.artistName} className="text-xs text-gray-500" />
        </div>
      </div>

      <ReorderControls index={index} isLast={isLast} onMove={moveSong} />
    </li>
  );
}
