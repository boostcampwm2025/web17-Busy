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

  isAuthenticated: boolean;
  followedIds: Set<string>;
  onFollowed: (userId: string) => void;
};

export default function UserSearchResults({ users, hasNext, isLoadingMore, loadMoreRef, isAuthenticated, followedIds, onFollowed }: Props) {
  return (
    <div className="space-y-1">
      {users.map((u) => (
        <UserItem
          key={u.id}
          user={{ ...u, isFollowing: u.isFollowing || followedIds.has(u.id) }}
          disabledFollow={!isAuthenticated}
          onFollowed={onFollowed}
        />
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
