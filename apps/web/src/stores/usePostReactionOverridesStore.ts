import { create } from 'zustand';

type LikeOverride = {
  isLiked: boolean;
  likeCount: number;
};

type CommentOverride = {
  commentCount: number;
};

type ContentOverride = {
  content: string;
};

type State = {
  likesByPostId: Record<string, LikeOverride>;
  commentsByPostId: Record<string, CommentOverride>;

  contentByPostId: Record<string, ContentOverride>;
  deletedPostId: string | null;

  setLikeOverride: (postId: string, next: LikeOverride) => void;
  clearLikeOverride: (postId: string) => void;

  setCommentOverride: (postId: string, next: CommentOverride) => void;
  clearCommentOverride: (postId: string) => void;

  setContentOverride: (postId: string, next: ContentOverride) => void;
  clearContentOverride: (postId: string) => void;

  setDeletedPostId: (postId: string) => void;
  clearDeletedPostId: () => void;
};

export const usePostReactionOverridesStore = create<State>((set) => ({
  likesByPostId: {},
  commentsByPostId: {},
  contentByPostId: {},

  deletedPostId: null,

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

  setContentOverride: (postId, next) =>
    set((s) => ({
      contentByPostId: {
        ...s.contentByPostId,
        [postId]: next,
      },
    })),

  clearContentOverride: (postId) =>
    set((s) => {
      const next = { ...s.contentByPostId };
      delete next[postId];
      return { contentByPostId: next };
    }),

  setDeletedPostId: (postId) => set({ deletedPostId: postId }),
  clearDeletedPostId: () => set({ deletedPostId: null }),
}));
