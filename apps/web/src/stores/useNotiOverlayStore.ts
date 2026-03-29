import { create } from 'zustand';

interface NotiOverlayStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useNotiOverlayStore = create<NotiOverlayStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
