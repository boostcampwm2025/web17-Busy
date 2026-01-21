import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 추가 데이터 fetch 오류

  // 초기 데이터 로드 관련 state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const initialLoadedRef = useRef(false); // 초기 데이터 fetch 재호출 방지 가드

  /** 무한 스크롤 관련 상태 업데이트 함수 */
  const updateScrollStates = useCallback((data: InfiniteResponse<T>) => {
    setItems((prev) => [...prev, ...data.items]);
    setHasNext(data.hasNext);
    setNextCursor(data.nextCursor);
    setErrorMsg(null);
  }, []);

  /** 초기 데이터 fetch 함수 */
  const loadInitialData = useCallback(async () => {
    try {
      const data = await fetchFn();
      updateScrollStates(data);
    } catch (err) {
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setIsInitialLoading(false); // 초기 데이터 fetching 로딩 상태는 따로 관리 (스켈레톤 UI 렌더링 목적)
    }
  }, [fetchFn, updateScrollStates]);

  /** 추가 데이터 fetch 함수 */
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading) return;
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 스피너 짧게 노출
    try {
      const data = await fetchFn(nextCursor);
      updateScrollStates(data);
    } catch {
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, hasNext, isLoading, nextCursor, updateScrollStates]);

  useEffect(() => {
    // 초기 로딩 전에만 실행
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (inView) loadMore();
  }, [inView]);

  return {
    items,
    setItems,
    hasNext,
    isInitialLoading,
    errorMsg,
    ref,
  };
}
