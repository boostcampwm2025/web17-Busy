'use client';

import { useMemo, useState } from 'react';
import { useItunesSearch, useUserSearch, useYoutubeSearch } from '@/hooks';
import { SearchMode } from '@/types';

export default function useSearchDrawer({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState('');

  /**
   * 팔로우 상태 오버라이드(Optimistic UI)
   * - userId -> true/false 로 강제 덮어쓰기
   * - 스크롤로 아이템이 unmount/mount 되어도 상태 유지
   */
  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());
  const [mode, setMode] = useState<SearchMode>('music');

  const itunes = useItunesSearch({ query, enabled: enabled && mode === 'music' });
  const users = useUserSearch({ query, enabled: enabled && mode === 'user' });
  const videos = useYoutubeSearch({ query, enabled: enabled && mode === 'video' });

  const active = useMemo(() => (mode === 'user' ? users : mode === 'video' ? videos : itunes), [mode, users, itunes, videos]);

  const clearQuery = () => setQuery('');

  const setFollowState = (userId: string, isFollowing: boolean) => {
    setFollowOverrides((prev) => {
      const next = new Map(prev);
      next.set(userId, isFollowing);
      return next;
    });
  };

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

    followOverrides,
    setFollowState,
  };
}
