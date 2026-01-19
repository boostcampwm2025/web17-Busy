import { fetchNotis, markNotiRead } from '@/api/noti/fetchNotis';
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
  readNoti: (notiId: string) => Promise<void>;
}

export const useNotiStore = create<NotiStore>((set) => ({
  notis: [],
  unreadCount: 0,

  status: 'idle',
  errorMessage: null,

  setFetchStatus: (status: NotiFetchState) => set((state) => (state.status === status ? state : { status })),

  updateNotis: async () => {
    set((state) => (state.status === 'idle' ? { status: 'loading', errorMessage: null } : state));

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

  readNoti: async (notiId: string) => {
    set((state) => {
      const updated = state.notis.map((n) => (n.id === notiId ? { ...n, isRead: true } : n));
      return {
        notis: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });

    try {
      await markNotiRead(notiId);
    } catch (e) {
      console.error((e as Error).message);
    }
  },
}));
