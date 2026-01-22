import { create } from 'zustand';

type LikeOverride = {
  isLiked: boolean;
  likeCount: number;
};

type State = {
  /** postId -> (isLiked/likeCount) 절대값 override */
  likesByPostId: Record<string, LikeOverride>;

  /** 특정 postId의 like 상태를 절대값으로 덮어씀 */
  setLikeOverride: (postId: string, next: LikeOverride) => void;

  /** 특정 postId의 override 제거(서버값으로 복귀) */
  clearLikeOverride: (postId: string) => void;
};

export const usePostReactionOverridesStore = create<State>((set) => ({
  likesByPostId: {},

  setLikeOverride: (postId, next) =>
    set((s) => ({
      likesByPostId: {
        ...s.likesByPostId,
        [postId]: next,
      },
    })),

  clearLikeOverride: (postId) =>
    set((s) => {
      const next = { ...s.likesByPostId };
      delete next[postId];
      return { likesByPostId: next };
    }),
}));
