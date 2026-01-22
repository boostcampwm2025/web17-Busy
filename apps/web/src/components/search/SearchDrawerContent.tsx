'use client';

import { useMemo } from 'react';

import { LoadingSpinner } from '@/components';
import { SearchInput, SearchStateMessage, MusicSearchResults, UserSearchResults } from './index';

import { ITUNES_SEARCH } from '@/constants';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useMusicActions, useSearchDrawer } from '@/hooks';

type Props = { enabled?: boolean };

function getHintMessage(trimmed: string): string | undefined {
  const needMin = trimmed.length > 0 && trimmed.length < ITUNES_SEARCH.MIN_QUERY_LENGTH;
  if (!needMin) return undefined;
  return `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.`;
}

function SearchDrawerInner({ enabled = true }: Props) {
  const { userId, isAuthenticated } = useAuthMe();
  const { addMusicToPlayer } = useMusicActions();

  const { query, setQuery, clearQuery, mode, itunes, users, active, followOverrides, setFollowState } = useSearchDrawer({ enabled });

  const hintMessage = useMemo(() => getHintMessage(active.trimmedQuery), [active.trimmedQuery]);

  const renderBody = () => {
    if (active.status === 'idle') {
      return <SearchStateMessage variant="hint" message={hintMessage} />;
    }
    if (active.status === 'loading') return <LoadingSpinner />;
    if (active.status === 'error') return <SearchStateMessage variant="error" message={active.errorMessage ?? undefined} />;
    if (active.status === 'empty') return <SearchStateMessage variant="empty" />;

    if (mode === 'music') {
      return <MusicSearchResults musics={itunes.results} onPlay={addMusicToPlayer} />;
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
      <div className="p-6 border-b-2 border-primary/10">
        <h2 className="text-3xl font-black text-primary mb-6">검색</h2>
        <SearchInput value={query} onChange={setQuery} onClear={clearQuery} placeholder="음악 검색, @사용자 검색" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>
    </div>
  );
}

export default function SearchDrawerContent({ enabled = true }: Props) {
  return <SearchDrawerInner enabled={enabled} />;
}
