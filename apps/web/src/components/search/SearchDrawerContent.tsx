'use client';

import { useMemo } from 'react';

import { LoadingSpinner } from '@/components';
import { SearchInput, SearchStateMessage, MusicSearchResults, UserSearchResults } from './index';

import { getHintMessage } from '@/utils';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useSearchDrawer } from '@/hooks';
import { SearchMode } from '@/types';

const SEARCH_TAB_TITLES = {
  music: '음원',
  user: '사용자',
  video: '유튜브',
} as const satisfies Record<SearchMode, string>;

const SEARCH_TAB_ENTRIES = Object.entries(SEARCH_TAB_TITLES) as [SearchMode, string][];

type Props = { enabled?: boolean };

function SearchDrawerInner({ enabled = true }: Props) {
  const { userId, isAuthenticated } = useAuthMe();
  const { query, setQuery, clearQuery, mode, handleChangeMode, itunes, users, videos, active, followOverrides, setFollowState } = useSearchDrawer({
    enabled,
  });

  const hintMessage = useMemo(() => getHintMessage(active.trimmedQuery), [active.trimmedQuery]);

  const renderBody = () => {
    if (active.status === 'idle') {
      return <SearchStateMessage variant="hint" message={hintMessage} />;
    }
    if (active.status === 'loading') return <LoadingSpinner />;
    if (active.status === 'error') return <SearchStateMessage variant="error" message={active.errorMessage ?? undefined} />;
    if (active.status === 'empty') return <SearchStateMessage variant="empty" />;

    if (mode === 'music') {
      return <MusicSearchResults mode={mode} items={itunes.results} isAuthenticated={isAuthenticated} />;
    }

    if (mode === 'video') {
      return <MusicSearchResults mode={mode} items={videos.results} isAuthenticated={isAuthenticated} />;
    }

    return (
      <UserSearchResults
        users={users.results}
        hasNext={users.hasNext}
        isLoadingMore={users.isLoadingMore}
        loadMoreRef={users.ref}
        meId={userId}
        isAuthenticated={isAuthenticated}
        followOverrides={followOverrides}
        onFollowChange={setFollowState}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-3xl font-black text-primary mb-6">검색</h2>
        <SearchInput value={query} onChange={setQuery} onClear={clearQuery} placeholder="음악 검색, 사용자 검색" />
      </div>

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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 border-t-2 border-primary/10">{renderBody()}</div>
    </div>
  );
}

export default function SearchDrawerContent({ enabled = true }: Props) {
  return <SearchDrawerInner enabled={enabled} />;
}
