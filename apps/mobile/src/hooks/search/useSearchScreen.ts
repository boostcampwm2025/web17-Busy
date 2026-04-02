import { useState } from 'react';
import { useItunesSearch } from './useItunesSearch';
import { useYoutubeSearch } from './useYoutubeSearch';
import { useUserSearch } from './useUserSearch';

export type SearchMode = 'music' | 'video' | 'user';

export const SEARCH_TABS: { mode: SearchMode; label: string }[] = [
  { mode: 'music', label: '음원' },
  { mode: 'video', label: '유튜브' },
  { mode: 'user', label: '사용자' },
];

export function useSearchScreen() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('music');

  const itunes = useItunesSearch({ query, enabled: mode === 'music' });
  const youtube = useYoutubeSearch({ query, enabled: mode === 'video' });
  const users = useUserSearch({ query, enabled: mode === 'user' });

  const active = mode === 'user' ? users : mode === 'video' ? youtube : itunes;

  const clearQuery = () => setQuery('');

  const handleChangeMode = (newMode: SearchMode) => {
    if (mode !== newMode) setMode(newMode);
  };

  return {
    query,
    setQuery,
    clearQuery,
    mode,
    handleChangeMode,
    itunes,
    youtube,
    users,
    active,
  };
}
