import { create } from 'zustand';

type AuthState = {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (payload: { userId: string | null; isAuthenticated: boolean }) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: ({ userId, isAuthenticated }) => set({ userId, isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ userId: null, isAuthenticated: false, isLoading: false }),
}));
