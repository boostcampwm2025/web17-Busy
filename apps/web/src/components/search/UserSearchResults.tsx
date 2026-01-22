'use client';

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

  /** userId -> isFollowing override */
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, next: boolean) => void;
};

export default function UserSearchResults({
  users,
  hasNext,
  isLoadingMore,
  loadMoreRef,
  meId,
  isAuthenticated,
  followOverrides,
  onFollowChange,
}: Props) {
  return (
    <div className="space-y-1">
      {users.map((u) => {
        const override = followOverrides.get(u.id);
        const isFollowing = override ?? u.isFollowing;

        return (
          <UserItem key={u.id} user={{ ...u, isFollowing }} isMe={u.id === meId} disabledFollow={!isAuthenticated} onFollowChange={onFollowChange} />
        );
      })}

      {hasNext ? <div ref={loadMoreRef} /> : null}

      {isLoadingMore ? (
        <div className="py-4">
          <LoadingSpinner />
        </div>
      ) : null}
    </div>
  );
}
