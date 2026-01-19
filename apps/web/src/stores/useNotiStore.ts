import { fetchNotis } from '@/api/noti/fetchNotis';
import { NotiResponseDto } from '@repo/dto';
import { create } from 'zustand';

type NotiFetchState = 'idle' | 'loading' | 'success' | 'error' | 'no-login';

interface NotiStore {
  notis: NotiResponseDto[];
  unreadCount: number;

  status: NotiFetchState;
  errorMessage: string | null;

  setFetchStatus: (status: NotiFetchState) => void;
  updateNotis: () => Promise<void>;
}

export const useNotiStore = create<NotiStore>((set) => ({
  notis: [],
  unreadCount: 0,

  status: 'idle',
  errorMessage: null,

  setFetchStatus: (status: NotiFetchState) => set({ status }),

  updateNotis: async () => {
    set({ status: 'loading', errorMessage: null });

    try {
      const notis = (await fetchNotis()) as NotiResponseDto[];
      set({
        notis,
        unreadCount: notis.filter((n) => !n.isRead).length,
        status: 'success',
      });
    } catch (e) {
      const err = e as { message?: string };
      set({
        status: 'error',
        errorMessage: err?.message ?? '알림을 불러오지 못했습니다.',
      });
    }
  },
}));
