import { ITUNES_SEARCH } from '@/constants';
import { useItunesSearch } from '@/hooks';
import type { MusicRequestDto as UnsavedMusic } from '@repo/dto';
import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

const MIN_QUERY_HINT = `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.`;

export function SearchDropdown({ isSearchOpen, handleAddSong }: { isSearchOpen: boolean; handleAddSong: (song: UnsavedMusic) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { status, results, errorMessage, trimmedQuery } = useItunesSearch({
    query: searchQuery,
    enabled: isSearchOpen,
  });

  const needMin = useMemo(() => trimmedQuery.length > 0 && trimmedQuery.length < ITUNES_SEARCH.MIN_QUERY_LENGTH, [trimmedQuery]);

  const renderSearchResults = () => {
    if (needMin) return <div className="p-4 text-center text-gray-2 text-sm">{MIN_QUERY_HINT}</div>;
    if (status === 'loading') return <div className="p-4 text-center text-gray-2 text-sm">검색 중...</div>;
    if (status === 'error') return <div className="p-4 text-center text-gray-2 text-sm">{errorMessage ?? '검색 중 오류가 발생했습니다.'}</div>;
    if (status === 'empty') return <div className="p-4 text-center text-gray-2 text-sm">검색 결과가 없습니다.</div>;

    return (
      <>
        {searchQuery && (
          <div className="mt-2 bg-white border-2 border-primary rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
            {results.map((song) => (
              <button
                key={song.id}
                onClick={() => handleAddSong({ ...song, id: undefined })}
                className="w-full flex items-center p-2 hover:bg-grayish text-left border-b border-gray-100 last:border-0"
              >
                <img src={song.albumCoverUrl} alt={song.title} className="w-8 h-8 rounded border border-gray-200 mr-2" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{song.title}</div>
                  <div className="text-xs text-gray-500 truncate">{song.artistName}</div>
                </div>
                <Plus className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

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
      {renderSearchResults()}
    </div>
  );
}
