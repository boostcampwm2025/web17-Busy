import type { MusicRequestDto as UnsavedMusic, MusicResponseDto as Music } from '@repo/dto';

import TickerText from '@/components/common/TickerText';

type Props = {
  items: Music[];
  handleAddSong: (song: UnsavedMusic) => void;
};

/** 검색 결과를 눌러 플레이리스트에 넣는 목록. 같은 이름의 components/search 쪽은 드로어용 브라우저다. */
export function AddSongResults({ items, handleAddSong }: Props) {
  return (
    <div className="bg-white border-2 border-primary rounded-xl max-h-40 overflow-y-auto custom-scrollbar shadow-md">
      {items.map((song) => (
        <button
          key={song.id}
          onClick={() => handleAddSong({ ...song, id: undefined })}
          className="w-full flex items-center p-2 hover:bg-gray-4 text-left border-b border-gray-100 last:border-0"
        >
          <img src={song.albumCoverUrl} alt={song.title} className="w-8 h-8 rounded border border-gray-200 mr-2" />
          <div className="flex-1 min-w-0">
            <TickerText text={song.title} className="font-bold text-sm" />
            <TickerText text={song.artistName} className="text-xs text-gray-500" />
          </div>
        </button>
      ))}
    </div>
  );
}
