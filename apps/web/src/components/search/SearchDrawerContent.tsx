'use client';

import { useMemo, useState } from 'react';

import { LoadingSpinner } from '@/components';
import { SearchInput, SearchStateMessage, TrackItem, UserItem } from './index';
import { useMusicActions, useItunesSearch, useUserSearch } from '@/hooks';
import { ITUNES_SEARCH } from '@/constants';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

type Props = { enabled?: boolean };

const isUserMode = (q: string) => q.trim().startsWith('@');
const stripAt = (q: string) => q.trim().replace(/^@+/, '');

function SearchDrawerInner({ enabled = true }: Props) {
  const [query, setQuery] = useState('');
  const { addMusicToPlayer } = useMusicActions();
  const { isAuthenticated } = useAuthMe();

  const userMode = useMemo(() => isUserMode(query), [query]);
  const keyword = useMemo(() => (userMode ? stripAt(query) : query), [query, userMode]);

  const itunes = useItunesSearch({ query: keyword, enabled: enabled && !userMode });
  const users = useUserSearch({ query: keyword, enabled: enabled && userMode });

  const handleQueryChange = (nextValue: string) => setQuery(nextValue);
  const handleQueryClear = () => setQuery('');

  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const renderIdle = (trimmed: string) => {
    const needMin = trimmed.length > 0 && trimmed.length < ITUNES_SEARCH.MIN_QUERY_LENGTH;
    const message = needMin ? `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.` : undefined;
    return <SearchStateMessage variant="hint" message={message} />;
  };

  const renderBody = () => {
    const state = userMode ? users : itunes;

    if (state.status === 'idle') return renderIdle(state.trimmedQuery);
    if (state.status === 'loading') return <LoadingSpinner />;
    if (state.status === 'error') return <SearchStateMessage variant="error" message={state.errorMessage ?? undefined} />;
    if (state.status === 'empty') return <SearchStateMessage variant="empty" />;

    if (!userMode) {
      return (
        <div className="space-y-1">
          {itunes.results.map((music) => (
            <TrackItem key={music.id} music={music} disabledActions onPlay={addMusicToPlayer} />
          ))}
        </div>
      );
    }

    const handleFollowed = (userId: string) => {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    // userMode: 팔로우 버튼은 로그인시에만 활성화
    // NOTE: 검색 결과를 즉시 "팔로우 중"으로 바꾸고 싶다면
    // useUserSearch 결과를 로컬 override하는 방식으로 확장 가능
    return (
      <div className="space-y-1">
        {users.results.map((u) => (
          <UserItem
            key={u.id}
            user={{ ...u, isFollowing: u.isFollowing || followedIds.has(u.id) }}
            disabledFollow={!isAuthenticated}
            onFollowed={handleFollowed}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b-2 border-primary/10">
        <h2 className="text-3xl font-black text-primary mb-6">검색</h2>
        <SearchInput value={query} onChange={handleQueryChange} onClear={handleQueryClear} placeholder="음악 검색, @사용자 검색" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>
    </div>
  );
}

export default function SearchDrawerContent({ enabled = true }: Props) {
  return <SearchDrawerInner enabled={enabled} />;
}
