import type { MusicRequestDto as UnsavedMusic } from '@repo/dto';

import { SearchTabs } from '@/components/common/SearchTabs';
import { useContentSearch } from '@/hooks/search/use-content-search';
import { getHintMessage } from '@/utils/hintMessage';
import { AddSongResults } from './AddSongResults';
import { SearchInput } from './SearchInput';
import { SearchStatusText } from './SearchStatusText';

export function SearchDropdown({ handleAddSong }: { handleAddSong: (song: UnsavedMusic) => void }) {
  const { query, setQuery, clearQuery, mode, setMode, active } = useContentSearch();

  const renderSearchResults = () => {
    if (active.status === 'idle') return <SearchStatusText>{getHintMessage(active.trimmedQuery)}</SearchStatusText>;
    if (active.status === 'loading') return <SearchStatusText>검색 중...</SearchStatusText>;
    if (active.status === 'error') return <SearchStatusText>{active.errorMessage ?? '검색 중 오류가 발생했습니다.'}</SearchStatusText>;
    if (active.status === 'empty') return <SearchStatusText>검색 결과가 없습니다.</SearchStatusText>;

    return <AddSongResults items={active.results} handleAddSong={handleAddSong} />;
  };

  return (
    <div className="border-b-2 border-primary bg-accent/10 p-4 animate-fade-in">
      <SearchInput value={query} onChange={setQuery} onClear={clearQuery} />

      {query && (
        <>
          <div className="mt-2">
            <SearchTabs mode={mode} onChange={setMode} />
          </div>

          <div className="relative mt-2 min-h-40">
            <div className="absolute inset-x-0 top-0 z-10">{renderSearchResults()}</div>
          </div>
        </>
      )}
    </div>
  );
}
