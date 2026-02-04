'use client';

import { useMemo, useState } from 'react';
import { Music as MusicIcon, Search, Sparkles } from 'lucide-react';

import { ITUNES_SEARCH } from '@/constants';
import { useItunesSearch, usePlaylistRecommendations, useYoutubeSearch, type PlaylistDetail } from '@/hooks';

import type { MusicResponseDto as Music } from '@repo/dto';
import { BriefItemList, EmptyPlaylist, LoadingMessage } from './PlaylistSectionInner';

import { SearchMode } from '@/types';
import { SEARCH_TAB_ENTRIES } from '@/components/search/SearchDrawerContent';

interface MusicSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;

  onAddMusic: (music: Music) => void;
  onAddPlaylist: (playlist: PlaylistDetail) => void;
}

const MIN_QUERY_HINT = `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.`;

export const MusicSearch = ({ searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, onAddMusic, onAddPlaylist }: MusicSearchProps) => {
  const [mode, setMode] = useState<SearchMode>('music');

  const itunes = useItunesSearch({
    query: searchQuery,
    enabled: isSearchOpen && mode === 'music',
  });
  const videos = useYoutubeSearch({
    query: searchQuery,
    enabled: isSearchOpen && mode === 'video',
  });
  const active = useMemo(() => (mode === 'video' ? videos : itunes), [mode, itunes, videos]);

  const handleChangeMode = (newMode: SearchMode) => {
    if (mode === newMode || newMode === 'user') return;
    setMode(newMode);
  };

  const hasQuery = useMemo(() => active.trimmedQuery.length > 0, [active.trimmedQuery]);
  const needMin = useMemo(() => active.trimmedQuery.length > 0 && active.trimmedQuery.length < ITUNES_SEARCH.MIN_QUERY_LENGTH, [active.trimmedQuery]);

  const recommendEnabled = useMemo(() => isSearchOpen && !hasQuery, [isSearchOpen, hasQuery]);

  const {
    status: playlistStatus,
    briefs,
    errorMessage: playlistError,
    selectedPlaylistId,
    refetch,
    selectPlaylist,
  } = usePlaylistRecommendations({ enabled: recommendEnabled });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchOpen(true);
  };

  const handleInputFocus = () => {
    setIsSearchOpen(true);
  };

  const handleCloseDropdown = () => {
    setIsSearchOpen(false);
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    const detail = await selectPlaylist(playlistId);
    if (!detail) return;

    onAddPlaylist(detail);
  };

  const renderPlaylistSection = () => {
    let playlistContent;

    if (playlistStatus === 'loading') {
      playlistContent = <LoadingMessage />;
    } else if (briefs.length === 0) {
      playlistContent = <EmptyPlaylist onClick={refetch} />;
    } else {
      playlistContent = <BriefItemList briefs={briefs} selectedPlaylistId={selectedPlaylistId} onSelect={handleSelectPlaylist} />;
    }

    return (
      <>
        <div className="px-4 py-2 flex items-center text-xs font-bold text-accent-cyan uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
          <Sparkles className="w-3 h-3 mr-1" />
          추천 (내 플레이리스트)
        </div>
        {playlistContent}
        {playlistError ? <div className="px-4 py-2 text-[11px] text-gray-2">{playlistError}</div> : null}
      </>
    );
  };

  const renderTabs = () => (
    <div className="px-2 pb-2">
      <div className="rounded-lg border border-gray-100 bg-white/70 p-1 shadow-sm">
        <div className="flex text-center gap-1">
          {SEARCH_TAB_ENTRIES.map(([tabMode, tabTitle]) => {
            if (tabMode === 'user') return;
            const isActive = mode === tabMode;
            return (
              <button
                key={tabMode}
                type="button"
                title={`${tabTitle} 검색`}
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
    </div>
  );

  const renderSearchResults = () => {
    if (needMin) return <div className="p-4 text-center text-gray-2 text-sm">{MIN_QUERY_HINT}</div>;
    if (active.status === 'loading') return <div className="p-4 text-center text-gray-2 text-sm">검색 중...</div>;
    if (active.status === 'error')
      return <div className="p-4 text-center text-gray-2 text-sm">{active.errorMessage ?? '검색 중 오류가 발생했습니다.'}</div>;
    if (active.status === 'empty') return <div className="p-4 text-center text-gray-2 text-sm">검색 결과가 없습니다.</div>;

    return (
      <>
        <div className="px-4 py-2 flex items-center text-xs font-bold text-gray-1 uppercase tracking-wider bg-gray-4/50 border-b border-gray-3 mb-1">
          <MusicIcon className="w-3 h-3 mr-1" />
          검색 결과
        </div>

        {active.results.map((music) => (
          <button
            key={music.id}
            type="button"
            onClick={() => onAddMusic(music)}
            className="w-full flex items-center px-4 py-2 hover:bg-gray-4 transition-colors text-left group"
          >
            <img src={music.albumCoverUrl} alt="art" className="w-10 h-10 rounded object-cover mr-3 border border-gray-3" />
            <div className="min-w-0">
              <p className="font-bold text-sm text-primary truncate group-hover:text-accent-cyan transition-colors">{music.title}</p>
              <p className="text-xs text-gray-1 truncate">{music.artistName}</p>
            </div>
          </button>
        ))}
      </>
    );
  };

  const renderBody = () => {
    if (!hasQuery) return renderPlaylistSection();
    return (
      <>
        {renderTabs()}
        {renderSearchResults()}
      </>
    );
  };

  return (
    <div className="relative mb-6">
      <label htmlFor="musicQuery" className="text-sm font-bold text-gray-1 mb-2 block">
        음악 검색
      </label>

      <div className="relative z-20">
        <input
          id="musicQuery"
          type="text"
          placeholder="어떤 음악을 공유하고 싶나요?"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-primary text-primary placeholder:text-gray-2
                     focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-accent-cyan transition-all font-medium"
        />
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-2" />
      </div>

      {isSearchOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-10" onClick={handleCloseDropdown} aria-label="close-search-dropdown" />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar z-20 py-2">
            {renderBody()}
          </div>
        </>
      ) : null}
    </div>
  );
};
