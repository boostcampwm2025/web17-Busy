'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { Music } from '@/types';
import { LoadingSpinner } from '@/components';

import SearchInput from './SearchInput';
import SearchState from './SearchState';
import TrackItem from './TrackItem';

import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useSpotifyAuthStore } from '@/stores';
import { searchSpotifyTracks } from '@/api';
import { spotifyTrackToMusic } from '@/mappers';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MARKET: 'KR' = 'KR';
const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

function SearchDrawerInner() {
  const ensureValidToken = useSpotifyAuthStore((s) => s.ensureValidToken);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<Music[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const trimmed = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (trimmed.length === 0) {
      setStatus('idle');
      setErrorMessage(null);
      setResults([]);
      return;
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setStatus('idle');
      setErrorMessage(null);
      setResults([]);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMessage(null);

    let isActive = true;

    const run = async () => {
      try {
        const token = await ensureValidToken();

        const tracks = await searchSpotifyTracks({
          query: trimmed,
          token,
          market: MARKET,
          limit: DEFAULT_LIMIT,
          offset: DEFAULT_OFFSET,
          signal: controller.signal,
        });

        const mapped = tracks.map(spotifyTrackToMusic);

        if (!isActive) {
          return;
        }

        setResults(mapped);
        setStatus(mapped.length > 0 ? 'success' : 'empty');
      } catch (e) {
        if (!isActive) {
          return;
        }

        const err = e as { name?: string; message?: string };
        if (err?.name === 'AbortError') {
          return;
        }

        setResults([]);
        setStatus('error');
        setErrorMessage(err?.message ?? '검색 중 오류가 발생했습니다.');
      }
    };

    void run();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [trimmed, ensureValidToken]);

  const handleQueryChange = (nextValue: string) => {
    setQuery(nextValue);
  };

  const handleQueryClear = () => {
    setQuery('');
  };

  const renderBody = () => {
    if (status === 'idle') {
      const message = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH ? '2글자 이상 입력해주세요.' : undefined;
      return <SearchState variant="hint" message={message} />;
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
        {results.map((music) => (
          <TrackItem key={music.musicId} music={music} disabledActions />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b-2 border-primary/10">
        <h2 className="text-3xl font-black text-primary mb-6">검색</h2>
        <SearchInput value={query} onChange={handleQueryChange} onClear={handleQueryClear} placeholder="음악 검색 (Spotify)" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>
    </div>
  );
}

export default function SearchDrawerContent() {
  return <SearchDrawerInner />;
}
