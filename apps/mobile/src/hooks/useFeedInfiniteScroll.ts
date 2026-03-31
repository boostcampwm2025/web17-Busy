import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cursor, FeedResponseDto, PostResponseDto as Post } from '@repo/dto';

interface UseFeedInfiniteScrollParams {
  fetchFn: (cursors?: Cursor, limit?: number) => Promise<FeedResponseDto>;
  resetKey?: string;
}

export function useFeedInfiniteScroll({ fetchFn, resetKey }: UseFeedInfiniteScrollParams) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [cursors, setCursors] = useState<Cursor>({ following: undefined, trending: undefined, recent: undefined });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prevResetKeyRef = useRef<string | undefined>(undefined);
  const initialLoadedRef = useRef(false);

  const dedupePosts = (list: Post[]) => Array.from(new Map(list.map((p) => [p.id, p])).values());

  const updateScrollStates = useCallback((data: FeedResponseDto) => {
    setPosts((prev) => dedupePosts([...prev, ...data.posts]));
    setHasNext(data.hasNext);
    setCursors({
      following: data.nextCursor?.following,
      trending: data.nextCursor?.trending,
      recent: data.nextCursor?.recent,
    });
    setErrorMsg(null);
  }, []);

  const reset = useCallback(() => {
    setPosts([]);
    setHasNext(false);
    setCursors({ following: undefined, trending: undefined, recent: undefined });
    setIsLoading(false);
    setErrorMsg(null);
    setIsInitialLoading(true);
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const data = await fetchFn();
      updateScrollStates(data);
    } catch {
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchFn, updateScrollStates]);

  /** FlatList onEndReached에 연결 */
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoading) return;
    setIsLoading(true);
    try {
      const data = await fetchFn(cursors);
      updateScrollStates(data);
    } catch {
      setErrorMsg('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, hasNext, isLoading, cursors, updateScrollStates]);

  useEffect(() => {
    if (initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (resetKey === undefined) return;
    const prev = prevResetKeyRef.current;
    prevResetKeyRef.current = resetKey;
    if (prev === undefined || prev === resetKey) return;

    initialLoadedRef.current = false;
    reset();
    void loadInitialData();
  }, [resetKey, reset, loadInitialData]);

  return {
    posts,
    setPosts,
    hasNext,
    isLoading,
    isInitialLoading,
    errorMsg,
    loadMore,
    reset,
  };
}
