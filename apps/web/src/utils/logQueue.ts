import type { LogEventDto } from '@repo/dto';
import { logsClient } from '@/api/internal/logsClient';

type Options = {
  flushSize?: number; // N=20
  flushIntervalMs?: number; // T=3000
  maxBufferSize?: number; // 200
};

const DEFAULTS: Required<Options> = {
  flushSize: 20,
  flushIntervalMs: 3000,
  maxBufferSize: 200,
};

let buffer: LogEventDto[] = [];
let flushTimer: number | null = null;
let flushing = false;

/** 외부에서 주입 가능한 설정(필요 시) */
let config: Required<Options> = { ...DEFAULTS };

const scheduleFlush = () => {
  if (flushTimer) return;

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, config.flushIntervalMs);
};

const dropOldestIfOverflow = () => {
  const overflow = buffer.length - config.maxBufferSize;
  if (overflow <= 0) return;

  // 오래된 이벤트부터 drop
  buffer = buffer.slice(overflow);
};

/**
 * enqueue: 이벤트를 버퍼에 넣고 조건에 따라 flush 트리거
 * - N개 이상이면 즉시 flush
 * - 아니면 T ms 후 flush 예약
 */
export const enqueueLog = (event: LogEventDto) => {
  if (typeof window === 'undefined') return;

  buffer.push(event);
  dropOldestIfOverflow();

  if (buffer.length >= config.flushSize) {
    void flush();
    return;
  }

  scheduleFlush();
};

/**
 * flush: 현재 버퍼를 /api/logs 로 배치 전송
 * - 실패하면 payload를 다시 버퍼 앞에 붙여서 유지(단 max 초과 시 drop)
 */
export const flush = async () => {
  if (typeof window === 'undefined') return;
  if (flushing) return;
  if (buffer.length === 0) return;

  flushing = true;

  const payload = buffer;
  buffer = [];

  try {
    await logsClient.post('/logs', { events: payload });
  } catch {
    // 실패 시 되돌리되, max 초과하면 오래된 것부터 drop
    buffer = [...payload, ...buffer];
    dropOldestIfOverflow();
  } finally {
    flushing = false;

    // 남은 이벤트가 있고, 타이머가 없다면 다시 예약
    if (buffer.length > 0) scheduleFlush();
  }
};

/**
 * 앱 시작 시 1회 호출 권장:
 * - 탭 종료/백그라운드 전환 시 best-effort flush
 */
export const initLogQueue = (opts?: Options) => {
  if (typeof window === 'undefined') return;

  config = { ...DEFAULTS, ...(opts ?? {}) };

  // visibilitychange 때 flush 시도
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  };

  window.addEventListener('visibilitychange', onVisibility);

  // unload 시 flush(best-effort)
  const onBeforeUnload = () => {
    // sendBeacon까지는 추후에 추가해도 됨
    // 지금은 best-effort로 flush만 호출
    void flush();
  };

  window.addEventListener('beforeunload', onBeforeUnload);

  // 중복 등록 방지용으로 cleanup은 필요 시 호출부에서 관리
};
