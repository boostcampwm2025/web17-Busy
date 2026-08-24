import type { MusicResponseDto } from '@repo/dto';
import { Music } from 'lucide-react';

import { useDragReorder } from '@/hooks/common/use-drag-reorder';
import { SongItem } from './SongItem';

type Props = {
  songs: MusicResponseDto[];
  selectedSongIds: Set<string>;
  toggleSelectSong: (musicId: string) => void;
  moveSong: (index: number, direction: 'up' | 'down') => void;
  moveSongTo: (from: number, to: number) => void;
};

export function SongList({ songs, selectedSongIds, toggleSelectSong, moveSong, moveSongTo }: Props) {
  const { dragOverIndex, getDragProps } = useDragReorder(moveSongTo);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2">
      {songs.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
          <Music className="w-12 h-12 mb-2" />
          <span className="font-bold">음악을 추가해보세요</span>
        </div>
      ) : (
        <ul className="space-y-1">
          {songs.map((song, index) => (
            <SongItem
              key={song.id}
              song={song}
              index={index}
              isLast={index === songs.length - 1}
              isChecked={selectedSongIds.has(song.id)}
              isDragOver={dragOverIndex === index}
              toggleSelectSong={toggleSelectSong}
              moveSong={moveSong}
              dragProps={getDragProps(index)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
