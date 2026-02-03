import { SEARCH_TAB_ENTRIES } from '@/components/search/SearchDrawerContent';
import { useItunesSearch, useYoutubeSearch } from '@/hooks';
import { SearchMode } from '@/types';
import { getHintMessage } from '@/utils';
import type { MusicRequestDto as UnsavedMusic } from '@repo/dto';
import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export function SearchDropdown({ handleAddSong }: { handleAddSong: (song: UnsavedMusic) => void }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('music');

  const itunes = useItunesSearch({ query, enabled: mode === 'music' });
  const videos = useYoutubeSearch({ query, enabled: mode === 'video' });

  const active = useMemo(() => (mode === 'video' ? videos : itunes), [mode, itunes, videos]);

  const clearQuery = () => setQuery('');

  const handleChangeMode = (newMode: SearchMode) => {
    if (mode === newMode || newMode === 'user') return;
    setMode(newMode);
  };

  const hintMessage = useMemo(() => getHintMessage(active.trimmedQuery), [active.trimmedQuery]);

  const renderSearchResults = () => {
    if (active.status === 'idle' && query) return <div className="p-4 text-center text-gray-2 text-sm">{hintMessage}</div>;
    if (active.status === 'idle') return;
    if (active.status === 'loading') return <div className="p-4 text-center text-gray-2 text-sm">검색 중...</div>;
    if (active.status === 'error')
      return <div className="p-4 text-center text-gray-2 text-sm">{active.errorMessage ?? '검색 중 오류가 발생했습니다.'}</div>;
    if (active.status === 'empty') return <div className="p-4 text-center text-gray-2 text-sm">검색 결과가 없습니다.</div>;

    return (
      <>
        {query && (
          <div className="mt-2 bg-white border-2 border-primary rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
            {active.results.map((song) => (
              <div key={song.id} className="w-full flex items-center p-2 hover:bg-grayish text-left border-b border-gray-100 last:border-0">
                <img src={song.albumCoverUrl} alt={song.title} className="w-8 h-8 rounded border border-gray-200 mr-2" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{song.title}</div>
                  <div className="text-xs text-gray-500 truncate">{song.artistName}</div>
                </div>
                <button onClick={() => handleAddSong({ ...song, id: undefined })}>
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
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
          placeholder="추가할 음악 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-primary focus:outline-none focus:ring-2 focus:ring-accent bg-white font-medium"
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {query && (
        <div className="flex text-center">
          {SEARCH_TAB_ENTRIES.map(([tabMode, tabTitle]) => (
            <button
              key={tabMode}
              title={`${tabTitle} 검색 탭`}
              onClick={() => handleChangeMode(tabMode)}
              className={`flex-1 p-2 text-sm sm:text-base ${mode === tabMode ? 'font-bold border-b-2 border-accent-pink' : 'text-gray-1'}`}
            >
              {tabTitle}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {renderSearchResults()}
    </div>
  );
}
