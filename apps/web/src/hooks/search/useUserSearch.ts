'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '@/hooks';
import { ITUNES_SEARCH } from '@/constants';
import { searchUsers } from '@/api';
import type { GetUserDto } from '@repo/dto';
import { MOCK_SEARCH_USERS } from '@/constants/mock/mockUsers';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
};

type Result = {
  status: SearchStatus;
  results: GetUserDto[];
  errorMessage: string | null;
  trimmedQuery: string;
};

const toErrorMessage = (): string => '검색 중 오류가 발생했습니다.';
const toFallbackMessage = (): string => '사용자 검색 API 미연동: 목업 데이터로 대체합니다. (백엔드 연동 후 제거)';

const filterMockUsers = (keyword: string): GetUserDto[] => {
  const q = keyword.trim().toLowerCase();
  if (!q) return [];

  return MOCK_SEARCH_USERS.filter((u) => u.nickname.toLowerCase().includes(q));
};

export default function useUserSearch({
  query,
  enabled = true,
  debounceMs = ITUNES_SEARCH.DEBOUNCE_MS,
  minQueryLength = ITUNES_SEARCH.MIN_QUERY_LENGTH,
}: Options): Result {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<GetUserDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!enabled) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    if (trimmedQuery.length === 0) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    if (trimmedQuery.length < minQueryLength) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    // NOTE: axios가 아니라 internalClient.get을 쓰면 abort signal 연결이 애매함.
    // 여기서는 간단히 "응답 적용 alive guard"로 race 방지.
    setStatus('loading');
    setErrorMessage(null);

    let alive = true;

    const run = async () => {
      try {
        const data = await searchUsers(trimmedQuery);
        if (!alive) return;

        const users = Array.isArray(data.users) ? data.users : [];
        setResults(users);
        setStatus(users.length > 0 ? 'success' : 'empty');
      } catch {
        if (!alive) return;

        /**
         * TODO(BE):
         * - /user/search 백엔드 연동 완료 후 fallback 제거
         * - error UX(토스트/재시도) 정책 확정
         */
        const fallback = filterMockUsers(trimmedQuery);

        setResults(fallback);
        setStatus(fallback.length > 0 ? 'success' : 'empty');
        setErrorMessage(toFallbackMessage());
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [enabled, trimmedQuery, minQueryLength]);

  return { status, results, errorMessage, trimmedQuery };
}
