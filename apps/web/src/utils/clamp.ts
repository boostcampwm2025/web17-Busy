export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const clampMs = (ms: number, maxMs: number) => {
  const safe = Number.isFinite(ms) ? ms : 0;
  return Math.min(Math.max(0, safe), Math.max(0, maxMs));
};
