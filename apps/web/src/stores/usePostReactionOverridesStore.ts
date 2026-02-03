import { create } from 'zustand';

type LikeOverride = {
  isLiked: boolean;
  likeCount: number;
};

type CommentOverride = {
  commentCount: number;
};

type State = {
  /** postId -> (isLiked/likeCount) 절대값 override */
  likesByPostId: Record<string, LikeOverride>;
  /** postId -> (commentCount) 절대값 override */
  commentsByPostId: Record<string, CommentOverride>;

  setLikeOverride: (postId: string, next: LikeOverride) => void;
  clearLikeOverride: (postId: string) => void;

  setCommentOverride: (postId: string, next: CommentOverride) => void;
  clearCommentOverride: (postId: string) => void;
};

export const usePostReactionOverridesStore = create<State>((set) => ({
  likesByPostId: {},
  commentsByPostId: {},

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

  setCommentOverride: (postId, next) =>
    set((s) => ({
      commentsByPostId: {
        ...s.commentsByPostId,
        [postId]: next,
      },
    })),

  clearCommentOverride: (postId) =>
    set((s) => {
      const next = { ...s.commentsByPostId };
      delete next[postId];
      return { commentsByPostId: next };
    }),
}));
