import { create } from 'zustand';
import { GetUserDto as Profile } from '@repo/dto';

interface ProfileState {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  toggleFollow: () => void;
  decrementFollowingCount: () => void;
  incrementFollowingCount: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  /** 현재 보고 있는 프로필 유저에 대한 팔로우/언팔로우 처리 */
  toggleFollow: () =>
    set((state) => {
      if (!state.profile) return {};
      const isFollowing = !state.profile.isFollowing;
      const followerCount = isFollowing ? state.profile.followerCount + 1 : state.profile.followerCount - 1;
      return { profile: { ...state.profile, isFollowing, followerCount } };
    }),

  /** 내 팔로잉 리스트(모달)에서 다른 유저를 언팔로우 했을 때, 내 프로필의 팔로잉 수 감소 */
  decrementFollowingCount: () =>
    set((state) => {
      if (!state.profile) return {};
      return {
        profile: { ...state.profile, followingCount: state.profile.followingCount - 1 },
      };
    }),

  /** 내 팔로워 리스트(모달)에서 다른 유저를 팔로우 했을 때, 내 프로필의 팔로잉 수 증가 */
  incrementFollowingCount: () =>
    set((state) => {
      if (!state.profile) return {};
      return {
        profile: { ...state.profile, followingCount: state.profile.followingCount + 1 },
      };
    }),
}));
