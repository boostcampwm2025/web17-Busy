'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Music } from '@/types';
import { LoadingSpinner } from '@/components';

import SearchInput from './SearchInput';
import SearchState from './SearchState';
import TrackItem from './TrackItem';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const LOADING_DELAY_MS = 200;
const ERROR_TRIGGER_KEYWORD = 'error';

const MOCK_MUSICS: Music[] = [
  {
    musicId: 'm1',
    trackUri: 'spotify:track:m1',
    provider: 'SPOTIFY',
    albumCoverUrl: 'https://picsum.photos/seed/art3/400/400',
    title: "we can't be friends",
    artistName: 'Ariana Grande',
    durationMs: 222_000,
  },
  {
    musicId: 'm2',
    trackUri: 'spotify:track:m2',
    provider: 'SPOTIFY',
    albumCoverUrl: 'https://picsum.photos/seed/art8/400/400',
    title: 'Die For You',
    artistName: 'The Weeknd',
    durationMs: 240_000,
  },
  {
    musicId: 'm3',
    trackUri: 'spotify:track:m3',
    provider: 'SPOTIFY',
    albumCoverUrl: 'https://picsum.photos/seed/art9/400/400',
    title: 'Ditto',
    artistName: 'NewJeans',
    durationMs: 188_000,
  },
];

function filterMusicsByQuery(musics: Music[], query: string): Music[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  return musics.filter((m) => m.title.toLowerCase().includes(q) || m.artistName.toLowerCase().includes(q));
}

function SearchDrawerInner() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = useMemo(() => filterMusicsByQuery(MOCK_MUSICS, query), [query]);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    const timer = window.setTimeout(() => {
      if (q.toLowerCase() === ERROR_TRIGGER_KEYWORD) {
        setStatus('error');
        setErrorMessage('검색 실패(테스트): error를 입력하면 오류 상태가 표시됩니다.');
        return;
      }

      setStatus(filtered.length > 0 ? 'success' : 'empty');
    }, LOADING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [query, filtered.length]);

  const handleQueryChange = (nextValue: string) => {
    setQuery(nextValue);
  };

  const handleQueryClear = () => {
    setQuery('');
  };

  const renderBody = () => {
    if (status === 'idle') {
      return <SearchState variant="hint" />;
    }

    if (status === 'loading') {
      return <LoadingSpinner />;
    }

    if (status === 'error') {
      return <SearchState variant="error" message={errorMessage ?? undefined} />;
    }

    if (status === 'empty') {
      return <SearchState variant="empty" />;
    }

    return (
      <div className="space-y-1">
        {filtered.map((music) => (
          <TrackItem key={music.musicId} music={music} disabledActions />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b-2 border-primary/10">
        <h2 className="text-3xl font-black text-primary mb-6">검색</h2>
        <SearchInput value={query} onChange={handleQueryChange} onClear={handleQueryClear} placeholder="음악 검색" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>
    </div>
  );
}

export default function SearchDrawerContent() {
  return <SearchDrawerInner />;
}
