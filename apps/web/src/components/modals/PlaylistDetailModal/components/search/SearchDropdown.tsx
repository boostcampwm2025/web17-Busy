import { SEARCH_TAB_ENTRIES } from '@/components/search/SearchDrawerContent';
import { useItunesSearch, useYoutubeSearch } from '@/hooks';
import { SearchMode } from '@/types';
import { getHintMessage } from '@/utils';
import type { MusicRequestDto as UnsavedMusic } from '@repo/dto';
import { useMemo, useState } from 'react';
import { SearchInput } from './SearchInput';
import { MusicSearchResults } from './MusicSearchResults';

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

    return <MusicSearchResults items={active.results} handleAddSong={handleAddSong} />;
  };

  return (
    <div className="border-b-2 border-primary bg-accent/10 p-4 animate-fade-in">
      <SearchInput value={query} onChange={setQuery} onClear={clearQuery} />

      {query && (
        <div className="mt-2 rounded-lg border border-gray-100 bg-white/70 p-1 shadow-sm">
          <div className="flex text-center gap-1">
            {SEARCH_TAB_ENTRIES.map(([tabMode, tabTitle]) => {
              if (tabMode === 'user') return;
              const isActive = mode === tabMode;
              return (
                <button
                  key={tabMode}
                  type="button"
                  title={`${tabTitle} 검색 탭`}
                  aria-pressed={isActive}
                  onClick={() => handleChangeMode(tabMode)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm sm:text-base transition-colors ${
                    isActive ? 'bg-primary font-bold text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
                  }`}
                >
                  {tabTitle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && renderSearchResults()}
    </div>
  );
}
