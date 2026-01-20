'use client';

import { useState } from 'react';

import { LoadingSpinner } from '@/components';
import { SearchInput, SearchStateMessage, TrackItem } from './index';
import { useMusicActions, useItunesSearch } from '@/hooks';
import { ITUNES_SEARCH } from '@/constants';

type Props = {
  enabled?: boolean;
};

function SearchDrawerInner({ enabled = true }: Props) {
  const [query, setQuery] = useState('');
  const { addMusicToPlayer } = useMusicActions();

  const { status, results, errorMessage, trimmedQuery } = useItunesSearch({
    query,
    enabled,
  });

  const handleQueryChange = (nextValue: string) => {
    setQuery(nextValue);
  };

  const handleQueryClear = () => {
    setQuery('');
  };

  const renderBody = () => {
    if (status === 'idle') {
      const needMin = trimmedQuery.length > 0 && trimmedQuery.length < ITUNES_SEARCH.MIN_QUERY_LENGTH;
      const message = needMin ? `${ITUNES_SEARCH.MIN_QUERY_LENGTH}글자 이상 입력해주세요.` : undefined;
      return <SearchStateMessage variant="hint" message={message} />;
    }

    if (status === 'loading') {
      return <LoadingSpinner />;
    }

    if (status === 'error') {
      return <SearchStateMessage variant="error" message={errorMessage ?? undefined} />;
    }

    if (status === 'empty') {
      return <SearchStateMessage variant="empty" />;
    }

    return (
      <div className="space-y-1">
        {results.map((music) => (
          <TrackItem key={music.id} music={music} disabledActions onPlay={addMusicToPlayer} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b-2 border-primary/10">
        <h2 className="text-3xl font-black text-primary mb-6">검색</h2>
        <SearchInput value={query} onChange={handleQueryChange} onClear={handleQueryClear} placeholder="음악 검색 (iTunes)" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">{renderBody()}</div>
    </div>
  );
}

export default function SearchDrawerContent({ enabled = true }: Props) {
  return <SearchDrawerInner enabled={enabled} />;
}
