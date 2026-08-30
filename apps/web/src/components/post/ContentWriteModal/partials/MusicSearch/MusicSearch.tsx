import { useMemo, useRef, useState } from 'react';
import type { MusicResponseDto as Music } from '@repo/dto';

import { SearchTabs } from '@/components/common/SearchTabs';
import { ITUNES_SEARCH } from '@/constants/search';
import { useOutsideClick } from '@/hooks/common/use-outside-click';
import { usePlaylistRecommendations, type PlaylistDetail } from '@/hooks/playlist/use-playlist-recommendations';
import useItunesSearch from '@/hooks/search/use-itunes-search';
import useYoutubeSearch from '@/hooks/search/use-youtube-search';
import type { SearchMode } from '@/types/search';

import MusicSearchInput from './MusicSearchInput';
import MusicSearchResults from './MusicSearchResults';
import PlaylistRecommendSection from './PlaylistRecommendSection';

interface MusicSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;

  onAddMusic: (music: Music) => void;
  onAddPlaylist: (playlist: PlaylistDetail) => void;
}

export const MusicSearch = ({ searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, onAddMusic, onAddPlaylist }: MusicSearchProps) => {
  const [mode, setMode] = useState<SearchMode>('music');
  const containerRef = useRef<HTMLDivElement>(null);

  useOutsideClick([containerRef], () => setIsSearchOpen(false), { enabled: isSearchOpen });

  const itunes = useItunesSearch({ query: searchQuery, enabled: isSearchOpen && mode === 'music' });
  const videos = useYoutubeSearch({ query: searchQuery, enabled: isSearchOpen && mode === 'video' });
  const active = useMemo(() => (mode === 'video' ? videos : itunes), [mode, itunes, videos]);

  const hasQuery = active.trimmedQuery.length > 0;
  const isBelowMinLength = hasQuery && active.trimmedQuery.length < ITUNES_SEARCH.MIN_QUERY_LENGTH;

  const recommendations = usePlaylistRecommendations({ enabled: isSearchOpen && !hasQuery });

  const handleChangeMode = (newMode: SearchMode) => {
    if (mode === newMode || newMode === 'user') return;
    setMode(newMode);
  };

  const handleQueryChange = (query: string) => {
    setSearchQuery(query);
    setIsSearchOpen(true);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    const detail = await recommendations.selectPlaylist(playlistId);
    if (!detail) return;

    onAddPlaylist(detail);
  };

  return (
    <div ref={containerRef} className="relative mb-6">
      <label htmlFor="musicQuery" className="text-sm font-bold text-gray-1 mb-2 block">
        음악 검색
      </label>

      <MusicSearchInput value={searchQuery} onChange={handleQueryChange} onFocus={() => setIsSearchOpen(true)} />

      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-xl shadow-lg max-h-60 overflow-y-auto overscroll-contain custom-scrollbar z-20 py-2">
          {hasQuery ? (
            <>
              <div className="px-2 pb-2">
                <SearchTabs mode={mode} onChange={handleChangeMode} />
              </div>
              <MusicSearchResults
                status={active.status}
                results={active.results}
                errorMessage={active.errorMessage}
                isBelowMinLength={isBelowMinLength}
                onAddMusic={onAddMusic}
              />
            </>
          ) : (
            <PlaylistRecommendSection
              status={recommendations.status}
              briefs={recommendations.briefs}
              errorMessage={recommendations.errorMessage}
              selectedPlaylistId={recommendations.selectedPlaylistId}
              onRetry={recommendations.refetch}
              onSelect={handleSelectPlaylist}
            />
          )}
        </div>
      )}
    </div>
  );
};
