import { useMemo } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { MusicResponseDto as Music } from '@repo/dto';

import type { SearchStatus } from '@/types/search';
import useDebouncedValue from '@/hooks/common/use-debounced-value';

/**
 * 같은 검색어를 다시 조회할 때 재요청하지 않는 시간.
 * 드롭다운을 닫았다 열거나 탭을 오갈 때 같은 결과를 다시 받아오지 않게 한다.
 */
export const EXTERNAL_SEARCH_STALE_TIME_MS = 5 * 60 * 1000;

const DEFAULT_ERROR_MESSAGE = '검색 중 오류가 발생했습니다.';

type Params = {
  query: string;
  enabled: boolean;
  debounceMs: number;
  minQueryLength: number;
  /** 검색어가 바뀌면 다른 query가 되어야 하므로 trim된 검색어를 받아 key를 만든다. */
  buildQueryKey: (trimmedQuery: string) => QueryKey;
  fetchResults: (trimmedQuery: string, signal: AbortSignal) => Promise<Music[]>;
};

export type ExternalSearchResult = {
  status: SearchStatus;
  results: Music[];
  errorMessage: string | null;
  trimmedQuery: string;
};

const EMPTY_RESULTS: Music[] = [];

/**
 * 외부 검색 API(iTunes·YouTube) 공용 조회 훅.
 *
 * 검색어마다 query key가 달라지므로, 늦게 도착한 이전 검색어의 응답은 그 검색어의 cache로 들어갈 뿐
 * 현재 화면을 덮어쓰지 않는다. 취소·경합 처리·결과 캐시를 직접 구현하지 않아도 되는 이유다.
 */
export const useExternalSearchQuery = ({ query, enabled, debounceMs, minQueryLength, buildQueryKey, fetchResults }: Params): ExternalSearchResult => {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const isEnabled = enabled && trimmedQuery.length > 0 && trimmedQuery.length >= minQueryLength;

  const searchQuery = useQuery({
    queryKey: buildQueryKey(trimmedQuery),
    queryFn: ({ signal }) => fetchResults(trimmedQuery, signal),
    enabled: isEnabled,
    staleTime: EXTERNAL_SEARCH_STALE_TIME_MS,
    // 검색은 입력 중 계속 바뀐다. 재시도하면 에러 표시가 늦어져 입력과 화면이 어긋난다.
    retry: false,
  });

  const results = isEnabled ? (searchQuery.data ?? EMPTY_RESULTS) : EMPTY_RESULTS;

  const status: SearchStatus = !isEnabled
    ? 'idle'
    : searchQuery.isPending
      ? 'loading'
      : searchQuery.isError
        ? 'error'
        : results.length > 0
          ? 'success'
          : 'empty';

  const errorMessage = status === 'error' ? ((searchQuery.error as Error | null)?.message ?? DEFAULT_ERROR_MESSAGE) : null;

  return { status, results, errorMessage, trimmedQuery };
};
