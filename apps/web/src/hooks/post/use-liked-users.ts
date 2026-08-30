'use client';

import { useQuery } from '@tanstack/react-query';
import type { LikedUserDto } from '@repo/dto';

import { getLikedUsers } from '@/api/internal';
import { queryKeys } from '@/api/queryKeys';

type Result = {
  users: LikedUserDto[];
  isLoading: boolean;
  errorMsg: string | null;
  refetch: () => void;
};

const EMPTY_USERS: LikedUserDto[] = [];
const ERROR_MESSAGE = '좋아요 목록을 불러오지 못했습니다.';

/**
 * 게시글의 좋아요 사용자 목록.
 *
 * `usePostLikeMutation`이 좋아요/취소 때마다 `queryKeys.posts.likedUsers`를 invalidate한다.
 * 이 훅이 같은 key를 구독해야 그 invalidate가 실제 재조회로 이어진다.
 */
export default function useLikedUsers({ enabled, postId }: { enabled: boolean; postId: string }): Result {
  const isEnabled = enabled && Boolean(postId);

  const query = useQuery({
    queryKey: queryKeys.posts.likedUsers(postId),
    queryFn: () => getLikedUsers(postId),
    enabled: isEnabled,
    // 목록에 '다시 시도' 버튼이 있다. 재시도로 에러 표시가 늦어지지 않게 한다.
    retry: false,
  });

  return {
    // 재조회가 실패하면 이전 목록을 남기지 않는다. 화면은 에러와 '다시 시도'만 보여준다.
    users: query.isError ? EMPTY_USERS : (query.data ?? EMPTY_USERS),
    isLoading: isEnabled && query.isPending,
    errorMsg: query.isError ? ERROR_MESSAGE : null,
    refetch: () => void query.refetch(),
  };
}
