export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: Spotify.PlayerInit) => Spotify.Player;
    };
  }

  namespace Spotify {
    interface Player {
      connect: () => Promise<boolean>;
      disconnect: () => void;
      addListener(event: 'ready' | 'not_ready', cb: (obj: WebPlaybackInst) => void): boolean;
      addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): boolean;
      addListener(event: string, cb: (data: any) => void): boolean;

      removeListener: (eventName: string, callback: (state: PlaybackState) => void) => boolean;
      getCurrentState: () => Promise<PlaybackState | null>;
      setVolume: (volume: number) => Promise<void>;
      pause: () => Promise<void>;
      resume: () => Promise<void>;
      togglePlay: () => Promise<void>;
      seek: (position_ms: number) => Promise<void>;
      previousTrack: () => Promise<void>;
      nextTrack: () => Promise<void>;
    }

    interface PlayerInit {
      name: string;
      getOAuthToken: (cb: (token: string) => void) => void;
      volume?: number;
    }

    interface WebPlaybackInst {
      device_id: string;
    }

    interface PlaybackState {
      context: {
        uri: string;
        metadata: any;
      };
      disallows: {
        pausing: boolean;
        peeking_next: boolean;
        peeking_prev: boolean;
        resuming: boolean;
        seeking: boolean;
        skipping_next: boolean;
        skipping_prev: boolean;
      };
      paused: boolean;
      position: number;
      repeat_mode: number;
      shuffle: boolean;
      track_window: {
        current_track: WebPlaybackTrack;
        previous_tracks: WebPlaybackTrack[];
        next_tracks: WebPlaybackTrack[];
      };
    }

    interface WebPlaybackTrack {
      uri: string;
      id: string | null;
      type: 'track' | 'episode' | 'ad';
      media_type: 'audio' | 'video';
      name: string;
      is_playable: boolean;
      duration_ms: number;
      album: {
        uri: string;
        name: string;
        images: { url: string }[];
      };
      artists: { uri: string; name: string }[];
    }
  }
}
