import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface InfiniteResponse<T> {
  items: T[];
  hasNext: boolean;
  nextCursor?: string; // UUID
}

interface UseInfiniteScrollParams<T> {
  initialData?: InfiniteResponse<T>;
  fetchFn: (cursor?: string, limit?: number) => Promise<InfiniteResponse<T>>;
}

export function useInfiniteScroll<T>({ initialData, fetchFn }: UseInfiniteScrollParams<T>) {
  const { ref, inView } = useInView({ threshold: 0.8, rootMargin: '200px' });

  const [items, setItems] = useState<T[]>(initialData?.items || []);
  const [hasNext, setHasNext] = useState<boolean>(initialData?.hasNext || true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialData?.nextCursor || undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /** 추가 데이터 fetch 함수 */
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading) return;
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 스피너 짧게 노출
      const data = await fetchFn(nextCursor); // 파라미터로 전달받은 fetch 함수 호출

      setItems((prev) => [...prev, ...data.items]);
      setHasNext(data.hasNext);
      setNextCursor(data.nextCursor);
      setError(null);
    } catch {
      setError('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, hasNext, isLoading, nextCursor]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView]);

  return {
    items,
    hasNext,
    isLoading,
    error,
    ref,
  };
}
