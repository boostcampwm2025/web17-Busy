import { create } from 'zustand';

interface NotiOverlayStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useNotiOverlayStore = create<NotiOverlayStore>((set) => ({
  isOpen: false,
  open: () => {
    set({ isOpen: true });
    history.pushState({ vibrPanel: 'noti' }, '');
  },
  close: () => set({ isOpen: false }),
}));
