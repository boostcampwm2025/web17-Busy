'use client';

import { useState } from 'react';

import type { ContentSearchMode } from '@/types/search';
import useItunesSearch from './use-itunes-search';
import useYoutubeSearch from './use-youtube-search';

/** 음원·유튜브만 검색한다. 사용자 검색까지 필요한 화면은 useSearchDrawer를 쓴다. */
export const useContentSearch = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ContentSearchMode>('music');

  const itunes = useItunesSearch({ query, enabled: mode === 'music' });
  const videos = useYoutubeSearch({ query, enabled: mode === 'video' });

  // useMemo를 걸지 않는다. itunes/videos가 렌더마다 새 객체라 어차피 매번 다시 계산된다.
  const active = mode === 'video' ? videos : itunes;

  const clearQuery = () => setQuery('');

  return { query, setQuery, clearQuery, mode, setMode, active };
};
