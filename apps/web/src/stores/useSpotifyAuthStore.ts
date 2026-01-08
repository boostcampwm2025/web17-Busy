import { create } from 'zustand';

type SpotifyAuthState = {
  accessToken: string | null;
  expiresAt: number | null;
  setAccessToken: (token: string, expiresInSec: number) => void;
  clear: () => void;
  ensureValidToken: () => Promise<string>;
};

const TOKEN_REFRESH_THRESHOLD_MS = 30_000;

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

    const isValid = Boolean(accessToken) && Boolean(expiresAt) && (expiresAt as number) - Date.now() > TOKEN_REFRESH_THRESHOLD_MS;

    if (isValid) {
      return accessToken as string;
    }

    const res = await fetch('/api/auth/spotify/token');
    if (!res.ok) {
      throw new Error('스포티파이 access token을 받아오는데 실패했습니다.');
    }

    const data = (await res.json()) as { accessToken: string; expiresIn: number };
    get().setAccessToken(data.accessToken, data.expiresIn);

    return data.accessToken;
  },
}));
