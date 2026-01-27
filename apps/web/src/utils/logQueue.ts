import type { LogEventDto } from '@repo/dto';
import { logsClient } from '@/api/internal/logsClient';

type Options = {
  flushSize?: number; // N=20
  flushIntervalMs?: number; // T=3000
  maxBufferSize?: number; // 200

  // 안정화 옵션
  maxEventBytes?: number; // 개별 이벤트 최대 크기(대략)
  maxBatchSize?: number; // flush 시 한 번에 보내는 최대 개수(청크)
};

const DEFAULTS: Required<Options> = {
  flushSize: 20,
  flushIntervalMs: 3000,
  maxBufferSize: 200,

  maxEventBytes: 8_000, // 이벤트 1개가 너무 커지면 drop (대략 8KB)
  maxBatchSize: 50, // 한 번 flush에 최대 50개만 전송
};

let buffer: LogEventDto[] = [];
let flushTimer: number | null = null;
let flushing = false;
let initialized = false;

/** 실패 백오프 */
let backoffMs = 0;
let backoffUntil = 0;

let config: Required<Options> = { ...DEFAULTS };

const now = () => Date.now();

const scheduleFlush = (delayMs = config.flushIntervalMs) => {
  if (flushTimer) return;

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, delayMs);
};

const clearFlushTimer = () => {
  if (!flushTimer) return;
  window.clearTimeout(flushTimer);
  flushTimer = null;
};

const dropOldestIfOverflow = () => {
  const overflow = buffer.length - config.maxBufferSize;
  if (overflow <= 0) return;
  buffer = buffer.slice(overflow);
};

const approxBytes = (obj: unknown): number => {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const canFlushNow = (): boolean => {
  if (backoffUntil <= 0) return true;
  return now() >= backoffUntil;
};

const setBackoff = () => {
  // 0 -> 1s -> 2s -> 4s -> 8s -> 16s(상한)
  backoffMs = backoffMs === 0 ? 1000 : Math.min(backoffMs * 2, 16000);
  backoffUntil = now() + backoffMs;
};

const clearBackoff = () => {
  backoffMs = 0;
  backoffUntil = 0;
};

const popBatch = (): LogEventDto[] => {
  const n = Math.min(buffer.length, config.maxBatchSize);
  const batch = buffer.slice(0, n);
  buffer = buffer.slice(n);
  return batch;
};

/**
 * enqueue: 이벤트를 버퍼에 넣고 조건에 따라 flush 트리거
 */
export const enqueueLog = (event: LogEventDto) => {
  if (typeof window === 'undefined') return;

  // 이벤트가 너무 크면 drop (운영 안정성)
  if (approxBytes(event) > config.maxEventBytes) return;

  buffer.push(event);
  dropOldestIfOverflow();

  // 백오프 중이면 타이머만 걸어둠
  if (!canFlushNow()) {
    scheduleFlush(Math.max(500, backoffUntil - now()));
    return;
  }

  if (buffer.length >= config.flushSize) {
    void flush();
    return;
  }

  scheduleFlush();
};

/**
 * flush: 버퍼를 /api/logs 로 배치 전송
 * - 실패하면 되돌리고 backoff 적용
 */
export const flush = async () => {
  if (typeof window === 'undefined') return;
  if (flushing) return;
  if (buffer.length === 0) return;

  // backoff 중이면 기다렸다가 시도
  if (!canFlushNow()) {
    scheduleFlush(Math.max(500, backoffUntil - now()));
    return;
  }

  flushing = true;

  // 청크 단위로 보냄 (너무 큰 배치 방지)
  const batch = popBatch();

  try {
    await logsClient.post('/logs', { events: batch });
    clearBackoff();
  } catch {
    // 실패한 batch는 앞에 다시 붙이고 backoff
    buffer = [...batch, ...buffer];
    dropOldestIfOverflow();
    setBackoff();
  } finally {
    flushing = false;

    // 남은 로그가 있으면 다시 예약/전송
    if (buffer.length > 0) {
      if (canFlushNow() && buffer.length >= config.flushSize) {
        void flush();
      } else {
        scheduleFlush();
      }
    }
  }
};

/**
 * unload/hidden 시 best-effort 전송
 * - 가능하면 sendBeacon 사용(axios보다 성공 확률이 높음)
 */
const flushWithBeacon = () => {
  if (buffer.length === 0) return;
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;

  try {
    const payload = JSON.stringify({ events: buffer });
    const blob = new Blob([payload], { type: 'application/json' });

    const ok = navigator.sendBeacon('/api/logs', blob);
    if (ok) {
      buffer = [];
      clearFlushTimer();
    }
  } catch {
    // ignore
  }
};

/**
 * 앱 시작 시 1회 호출 권장:
 * - visibilitychange / beforeunload hook
 * - 중복 등록 방지 + cleanup 제공
 */
export const initLogQueue = (opts?: Options) => {
  if (typeof window === 'undefined') return () => {};
  if (initialized) return () => {};

  initialized = true;
  config = { ...DEFAULTS, ...(opts ?? {}) };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      flushWithBeacon();
      void flush(); // beacon 불가 환경 대비
    }
  };

  const onBeforeUnload = () => {
    flushWithBeacon();
    // async flush는 보장 안되지만 best-effort
    void flush();
  };

  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('beforeunload', onBeforeUnload);

  return () => {
    initialized = false;
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('beforeunload', onBeforeUnload);
    clearFlushTimer();
  };
};
