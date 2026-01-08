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
};

export const useSpotifyPlayerStore = create<SpotifyPlayerState>((set) => ({
  sdkReady: false,
  setSdkReady: (sdkReady) => set({ sdkReady }),

  player: null,
  deviceId: null,

  active: false,
  paused: true,

  setPlayer: (player) => set({ player }),
  setDeviceId: (deviceId) => set({ deviceId }),

  setActive: (active) => set({ active }),
  setPaused: (paused) => set({ paused }),
}));
