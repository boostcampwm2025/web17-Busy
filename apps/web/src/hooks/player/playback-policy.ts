import { DEFAULT_VOLUME } from '@/constants/player';
import { clamp01, clampMs } from '@/utils/clamp';

/**
 * itunes(HTMLAudioElement)와 youtube(YT.Player)는 SDK 모양이 달라 어댑터 자체는 합치지 않는다.
 * 다만 아래 넷은 SDK를 전혀 모르는 순수 정책이라, 한쪽만 고쳐져 갈라지지 않도록 여기에 모은다.
 */

/** 초 단위 길이를 ms로. NaN·Infinity·음수는 전부 "아직 모름"을 뜻하는 0으로 눕힌다. */
export const toDurationMs = (seconds: number): number => (Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds * 1000) : 0);

/** 저장된 볼륨이 깨져 있으면(NaN 등) 기본값으로 되돌린다. */
export const normalizeVolume = (volume: number): number => (Number.isFinite(volume) ? clamp01(volume) : DEFAULT_VOLUME);

/**
 * 이동할 재생 위치를 정한다. SDK가 알려주는 길이를 우선하고, 아직 모르면 지금까지 알던 길이를 쓴다.
 * 둘 다 0이면 null — 길이를 모르는 채로 이동하면 어디까지 clamp할지가 정의되지 않는다.
 */
export const resolveSeekTarget = (
  requestedMs: number,
  metaDurationMs: number,
  knownDurationMs: number,
): { positionMs: number; durationMs: number } | null => {
  const maxMs = metaDurationMs > 0 ? metaDurationMs : knownDurationMs;
  if (maxMs <= 0) return null;

  return { positionMs: clampMs(requestedMs, maxMs), durationMs: maxMs };
};

/** 큐에 곡이 하나뿐이면 다음 곡으로 넘기는 대신 그 곡을 반복한다. */
export const shouldRepeatSingle = (queueLength: number): boolean => queueLength <= 1;
