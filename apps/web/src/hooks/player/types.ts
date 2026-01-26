export type PlayerProgress = {
  positionMs: number;
  durationMs: number;
};

export type Playback = PlayerProgress & {
  seekToMs: (ms: number) => void;
};
