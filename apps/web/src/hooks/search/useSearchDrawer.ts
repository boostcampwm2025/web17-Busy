'use client';

import { useMemo, useState } from 'react';
import { useItunesSearch, useUserSearch } from '@/hooks';

type Mode = 'music' | 'user';

const isUserMode = (q: string) => q.trim().startsWith('@');
const stripAt = (q: string) => q.trim().replace(/^@+/, '');

export default function useSearchDrawer({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState('');
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const mode: Mode = useMemo(() => (isUserMode(query) ? 'user' : 'music'), [query]);
  const keyword = useMemo(() => (mode === 'user' ? stripAt(query) : query), [mode, query]);

  const itunes = useItunesSearch({ query: keyword, enabled: enabled && mode === 'music' });
  const users = useUserSearch({ query: keyword, enabled: enabled && mode === 'user' });

  const active = useMemo(() => (mode === 'user' ? users : itunes), [mode, users, itunes]);

  const clearQuery = () => setQuery('');

  const markFollowed = (userId: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
  };

  return {
    query,
    setQuery,
    clearQuery,

    mode,
    keyword,

    itunes,
    users,

    active,

    followedIds,
    markFollowed,
  };
}
