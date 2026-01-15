import { create } from 'zustand';

type SpotifyPlayerState = {
  sdkReady: boolean;
  setSdkReady: (ready: boolean) => void;

  player: Spotify.Player | null;
  deviceId: string | null;

  // todo 필요한 건지 확인
  active: boolean;
  paused: boolean;

  setPlayer: (player: Spotify.Player | null) => void;
  setDeviceId: (deviceId: string | null) => void;

  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;

  reset: () => void;
};

const initialState = {
  sdkReady: false,
  player: null,
  deviceId: null,
  active: false,
  paused: true,
} as const;

export const useSpotifyPlayerStore = create<SpotifyPlayerState>((set) => ({
  ...initialState,

  setSdkReady: (sdkReady) => set({ sdkReady }),

  setPlayer: (player) => set({ player }),
  setDeviceId: (deviceId) => set({ deviceId }),

  setActive: (active) => set({ active }),
  setPaused: (paused) => set({ paused }),

  reset: () => set({ ...initialState }),
}));
