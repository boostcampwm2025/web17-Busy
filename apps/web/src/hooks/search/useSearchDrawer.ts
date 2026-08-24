'use client';

import { useMemo, useState } from 'react';
import useItunesSearch from '@/hooks/search/use-itunes-search';
import useUserSearch from '@/hooks/search/useUserSearch';
import useYoutubeSearch from '@/hooks/search/useYoutubeSearch';
import { SearchMode } from '@/types/search';

export default function useSearchDrawer({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('music');

  const itunes = useItunesSearch({ query, enabled: enabled && mode === 'music' });
  const users = useUserSearch({ query, enabled: enabled && mode === 'user' });
  const videos = useYoutubeSearch({ query, enabled: enabled && mode === 'video' });

  const active = useMemo(() => (mode === 'user' ? users : mode === 'video' ? videos : itunes), [mode, users, itunes, videos]);

  const clearQuery = () => setQuery('');

  const handleChangeMode = (newMode: SearchMode) => {
    if (mode === newMode) return;
    setMode(newMode);
  };

  return {
    query,
    setQuery,
    clearQuery,

    mode,
    handleChangeMode,

    itunes,
    users,
    videos,
    active,
  };
}
