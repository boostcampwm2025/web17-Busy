import { create } from 'zustand';

type PlaylistRefreshState = {
  nonce: number;
  bump: () => void;
};

export const usePlaylistRefreshStore = create<PlaylistRefreshState>((set) => ({
  nonce: 0,
  bump: () => set((s) => ({ nonce: s.nonce + 1 })),
}));
