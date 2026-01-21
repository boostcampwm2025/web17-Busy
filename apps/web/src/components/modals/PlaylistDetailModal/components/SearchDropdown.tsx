import type { MusicRequestDto as UnsavedMusic } from '@repo/dto';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

export function SearchDropdown({ handleAddSong }: { handleAddSong: (song: UnsavedMusic) => void }) {
  const searchResults: any[] = [];

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="border-b-2 border-primary bg-accent/10 p-4 animate-fade-in">
      <div className="relative">
        <input
          type="text"
          autoFocus
          placeholder="추가할 음악 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-primary focus:outline-none focus:ring-2 focus:ring-accent bg-white font-medium"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mt-2 bg-white border-2 border-primary rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
          {searchResults.length > 0 ? (
            searchResults.map((song) => (
              <button
                key={song.id}
                onClick={() => handleAddSong(song)}
                className="w-full flex items-center p-2 hover:bg-grayish text-left border-b border-gray-100 last:border-0"
              >
                <img src={song.coverUrl} alt="" className="w-8 h-8 rounded border border-gray-200 mr-2" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{song.title}</div>
                  <div className="text-xs text-gray-500 truncate">{song.artist}</div>
                </div>
                <Plus className="w-4 h-4 text-primary" />
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 font-medium">검색 결과 없음</div>
          )}
        </div>
      )}
    </div>
  );
}
