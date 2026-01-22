import { create } from 'zustand';

type FeedRefreshState = {
  nonce: number;
  bump: () => void;
};

export const useFeedRefreshStore = create<FeedRefreshState>((set) => ({
  nonce: 0,
  bump: () => set((s) => ({ nonce: s.nonce + 1 })),
}));
