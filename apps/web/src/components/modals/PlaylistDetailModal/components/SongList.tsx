import { usePlayerStore } from '@/stores';
import type { MusicResponseDto } from '@repo/dto';
import { CheckSquare, ChevronDown, ChevronUp, Music, Play, Square } from 'lucide-react';

function SongItem({
  song,
  idx,
  isLast,
  isChecked,
  toggleSelectSong,
  moveSong,
}: {
  song: MusicResponseDto;
  idx: number;
  isLast: boolean;
  isChecked: boolean;
  toggleSelectSong: (musicId: string) => void;
  moveSong: (index: number, direction: 'up' | 'down') => void;
}) {
  const playMusic = usePlayerStore((s) => s.playMusic);

  return (
    <li className="group flex items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
      {/* Checkbox (Left) */}
      <button onClick={() => toggleSelectSong(song.id)} className="mr-3 text-gray-300 hover:text-primary transition-colors">
        {isChecked ? <CheckSquare className="w-5 h-5 text-secondary" /> : <Square className="w-5 h-5" />}
      </button>

      {/* Song Info (Click to play individual) */}
      <div className="flex items-center flex-1 min-w-0 cursor-pointer" onClick={() => playMusic(song)}>
        <div className="relative w-10 h-10 mr-3 flex-shrink-0">
          <img src={song.albumCoverUrl} alt="cover" className="w-full h-full rounded border border-gray-200 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded flex items-center justify-center transition-colors">
            <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 fill-current drop-shadow-md" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-primary truncate">{song.title}</p>
          <p className="text-xs text-gray-500 truncate">{song.artistName}</p>
        </div>
      </div>

      {/* Reorder Controls (Right) */}
      <div className="flex flex-col ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => moveSong(idx, 'up')} disabled={idx === 0} className="p-0.5 hover:text-accent disabled:opacity-20">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={() => moveSong(idx, 'down')} disabled={isLast} className="p-0.5 hover:text-accent disabled:opacity-20">
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}

export function SongList({
  songs,
  selectedSongIds,
  toggleSelectSong,
  moveSong,
}: {
  songs: MusicResponseDto[];
  selectedSongIds: Set<string>;
  toggleSelectSong: (musicId: string) => void;
  moveSong: (index: number, direction: 'up' | 'down') => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2">
      {songs.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
          <Music className="w-12 h-12 mb-2" />
          <span className="font-bold">음악을 추가해보세요</span>
        </div>
      ) : (
        <ul className="space-y-1">
          {songs.map((song, idx) => (
            <SongItem
              key={song.id}
              song={song}
              idx={idx}
              isLast={idx === songs.length - 1}
              isChecked={selectedSongIds.has(song.id)}
              toggleSelectSong={toggleSelectSong}
              moveSong={moveSong}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
