'use client';

import { memo } from 'react';
import type { SearchUsersResDto } from '@repo/dto';
import { LoadingSpinner } from '@/components';
import { UserItem } from './index';

type SearchUser = SearchUsersResDto['users'][number];

type Props = {
  users: SearchUser[];
  hasNext: boolean;
  isLoadingMore: boolean;
  loadMoreRef: (node?: Element | null) => void;

  meId: string | null;
  isAuthenticated: boolean;
};

function UserSearchResults({ users, hasNext, isLoadingMore, loadMoreRef, meId, isAuthenticated }: Props) {
  return (
    <div className="space-y-1">
      {/* 팔로우 상태는 query cache에서 내려온 값을 그대로 쓴다. 로컬 override를 두면 cache와 어긋난다. */}
      {users.map((u) => (
        <UserItem key={u.id} user={u} meId={meId} disabledFollow={!isAuthenticated} />
      ))}

      {hasNext ? <div ref={loadMoreRef} /> : null}

      {isLoadingMore ? (
        <div className="py-4">
          <LoadingSpinner />
        </div>
      ) : null}
    </div>
  );
}

export default memo(UserSearchResults);
