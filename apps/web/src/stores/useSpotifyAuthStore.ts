import { create } from 'zustand';

type SpotifyAuthState = {
  accessToken: string | null;
  expiresAt: number | null;
  setAccessToken: (token: string, expiresInSec: number) => void;
  clear: () => void;
  ensureValidToken: () => Promise<string>;
};

export const useSpotifyAuthStore = create<SpotifyAuthState>((set, get) => ({
  accessToken: null,
  expiresAt: null,

  setAccessToken: (token, expiresInSec) => {
    const expiresAt = Date.now() + expiresInSec * 1000;
    set({ accessToken: token, expiresAt });
  },

  clear: () => set({ accessToken: null, expiresAt: null }),

  ensureValidToken: async () => {
    const { accessToken, expiresAt } = get();

    // expiresAt이 30초도 안 남았으면 갱신
    const isValid = accessToken && expiresAt && expiresAt - Date.now() > 30_000;

    if (isValid) return accessToken;

    const res = await fetch('/api/auth/spotify/token');
    if (!res.ok) throw new Error('스포티파이 access token을 받아오는데 실패했습니다.');

    const data = (await res.json()) as { accessToken: string; expiresIn: number };

    get().setAccessToken(data.accessToken, data.expiresIn);
    return data.accessToken;
  },
}));
