'use client';

import { useEffect, useState } from 'react';
import type { LikedUserDto } from '@repo/dto';
import { getLikedUsers } from '@/api/internal';

type Result = {
  users: LikedUserDto[];
  isLoading: boolean;
  errorMsg: string | null;
  refetch: () => void;
};

export default function useLikedUsers({ enabled, postId }: { enabled: boolean; postId: string }): Result {
  const [users, setUsers] = useState<LikedUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((v) => v + 1);

  useEffect(() => {
    if (!enabled) return;
    if (!postId) return;

    let alive = true;

    const run = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const data = await getLikedUsers(postId);
        if (!alive) return;
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        if (!alive) return;
        setUsers([]);
        setErrorMsg('좋아요 목록을 불러오지 못했습니다.');
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [enabled, postId, tick]);

  return { users, isLoading, errorMsg, refetch };
}
