'use client';

import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import type { Music } from '@/types';
import { ErrorScreen, LoadingSpinner } from '@/components';

import SearchInput from './SearchInput';
import SearchState from './SearchState';
import TrackItem from './TrackItem';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty';

const LOADING_DELAY_MS = 200;

const MOCK_MUSICS: Music[] = [
  {
    musicId: 'm1',
    trackUri: 'spotify:track:m1',
    provider: 'SPOTIFY',
    albumCoverUrl: 'https://i.scdn.co/image/ab67616d0000b273c09e663da6711c2653303c6a',
    title: "we can't be friends",
    artistName: 'Ariana Grande',
    durationMs: 222_000,
  },
  {
    musicId: 'm2',
    trackUri: 'spotify:track:m2',
    provider: 'SPOTIFY',
    albumCoverUrl: 'https://i.scdn.co/image/ab67616d0000b27390635da24c3031d277a83d09',
    title: 'Die For You',
    artistName: 'The Weeknd',
    durationMs: 240_000,
  },
  {
    musicId: 'm3',
    trackUri: 'spotify:track:m3',
    provider: 'SPOTIFY',
    albumCoverUrl: 'https://i.scdn.co/image/ab67616d0000b2739d28fd018590e3a6c116d447',
    title: 'Ditto',
    artistName: 'NewJeans',
    durationMs: 188_000,
  },
];

function SearchDrawerInner() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    return MOCK_MUSICS.filter((m) => m.title.toLowerCase().includes(q) || m.artistName.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
      setStatus('idle');
      return;
    }

    setStatus('loading');

    const timer = window.setTimeout(() => {
      if (q.toLowerCase() === 'error') {
        throw new Error('검색 실패(테스트): error를 입력하면 오류가 발생합니다.');
      }
      setStatus(filtered.length > 0 ? 'success' : 'empty');
    }, LOADING_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [query, filtered.length]);

  const handleQueryChange = (next: string) => {
    setQuery(next);
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
  return (
    <ErrorBoundary FallbackComponent={ErrorScreen}>
      <SearchDrawerInner />
    </ErrorBoundary>
  );
}
