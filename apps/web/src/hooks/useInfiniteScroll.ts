import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface InfiniteResponse<T> {
  items: T[];
  hasNext: boolean;
  nextCursor?: string; // UUID
}

interface UseInfiniteScrollParams<T> {
  fetchFn: (cursor?: string, limit?: number) => Promise<InfiniteResponse<T>>;
}

export default function useInfiniteScroll<T>({ fetchFn }: UseInfiniteScrollParams<T>) {
  const { ref, inView } = useInView({ threshold: 0.8, rootMargin: '200px' });

  const [items, setItems] = useState<T[]>([]);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateScrollStates = useCallback(
    (data: InfiniteResponse<T>) => {
      setItems((prev) => [...prev, ...data.items]);
      setHasNext(data.hasNext);
      setNextCursor(data.nextCursor);
      setError(null);
    },
    [fetchFn],
  );

  /** 초기 데이터 fetch 함수 */
  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const data = await fetchFn();
      updateScrollStates(data);
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchFn]);

  /** 추가 데이터 fetch 함수 */
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading) return;
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 스피너 짧게 노출
    try {
      const data = await fetchFn(nextCursor);
      updateScrollStates(data);
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, hasNext, isLoading, nextCursor]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView]);

  return {
    items,
    hasNext,
    isLoading,
    isInitialLoading,
    error,
    ref,
  };
}
