'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateProfileDto, UserDto } from '@repo/dto';

import { addFollow, removeFollow } from '@/api/internal/follow';
import { queryKeys } from '@/api/queryKeys';
import { updateProfile } from '@/api/internal/user';
import { applyFollowResultToProfileCaches, patchProfileInCache } from './profile-cache-updaters';

type FollowVariables = {
  targetUserId: string;
  viewerUserId: string | null;
  wasFollowing: boolean;
};

export const useProfileFollowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, wasFollowing }: FollowVariables) => {
      if (wasFollowing) await removeFollow(targetUserId);
      else await addFollow(targetUserId);
    },
    onSuccess: (_data, variables) => {
      applyFollowResultToProfileCaches(queryClient, variables);
    },
    onSettled: (_data, _error, { targetUserId, viewerUserId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(targetUserId) });

      if (viewerUserId && viewerUserId !== targetUserId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(viewerUserId) });
      }
    },
  });
};

export const useUpdateProfileMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: UpdateProfileDto) => updateProfile(profile),
    onSuccess: (_data, profile) => {
      patchProfileInCache(queryClient, userId, profile);
      queryClient.setQueryData<UserDto | null>(queryKeys.auth.me, (current) => (current ? { ...current, nickname: profile.nickname } : current));

      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(userId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
};
