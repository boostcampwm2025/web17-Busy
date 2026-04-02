import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchUsers } from '@/src/api/user';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { ITUNES_SEARCH } from '@/src/constants';
import type { SearchUserDto } from '@repo/dto';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
};

type Result = {
  status: SearchStatus;
  results: SearchUserDto[];
  errorMessage: string | null;
  trimmedQuery: string;
  hasNext: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
};

const DEFAULT_LIMIT = 10;

export function useUserSearch({
  query,
  enabled = true,
  debounceMs = ITUNES_SEARCH.DEBOUNCE_MS,
  minQueryLength = ITUNES_SEARCH.MIN_QUERY_LENGTH,
  limit = DEFAULT_LIMIT,
}: Options): Result {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<SearchUserDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const loadingMoreRef = useRef(false);

  const canFetch = enabled && trimmedQuery.length >= minQueryLength;

  // 쿼리 변경 시 초기 검색
  useEffect(() => {
    if (!canFetch) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      setHasNext(false);
      cursorRef.current = undefined;
      return;
    }

    let alive = true;
    setStatus('loading');
    setResults([]);
    setErrorMessage(null);
    cursorRef.current = undefined;

    const run = async () => {
      try {
        const data = await searchUsers(trimmedQuery, undefined, limit);
        if (!alive) return;

        const users = Array.isArray(data.users) ? data.users : [];
        cursorRef.current = data.nextCursor;
        setResults(users);
        setHasNext(Boolean(data.hasNext));
        setStatus(users.length > 0 ? 'success' : 'empty');
      } catch (e) {
        if (!alive) return;
        const err = e as { message?: string };
        setResults([]);
        setStatus('error');
        setErrorMessage(err?.message ?? '검색 중 오류가 발생했습니다.');
      }
    };

    void run();
    return () => {
      alive = false;
    };
  }, [canFetch, trimmedQuery, limit]);

  const loadMore = useCallback(() => {
    if (!hasNext || loadingMoreRef.current || !cursorRef.current) return;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    searchUsers(trimmedQuery, cursorRef.current, limit)
      .then((data) => {
        const users = Array.isArray(data.users) ? data.users : [];
        cursorRef.current = data.nextCursor;
        setResults((prev) => [...prev, ...users]);
        setHasNext(Boolean(data.hasNext));
      })
      .catch(() => {
        // loadMore 실패는 조용히 처리
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      });
  }, [hasNext, trimmedQuery, limit]);

  return { status, results, errorMessage, trimmedQuery, hasNext, isLoadingMore, loadMore };
}
