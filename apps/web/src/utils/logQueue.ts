import type { LogEventDto } from '@repo/dto';
import { logsClient } from '@/api/internal/logsClient';
import axios from 'axios';

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

  maxEventBytes: 8_000,
  maxBatchSize: 50,
};

let buffer: LogEventDto[] = [];
let flushTimer: number | null = null;
let flushing = false;
let initialized = false;

/** 실패 백오프 */
let backoffMs = 0;
let backoffUntil = 0;

let config: Required<Options> = { ...DEFAULTS };

/**
 * 유실 지점별 계측. 버리는 경로가 전부 조용한 return이라 흔적이 남지 않아,
 * 어디서 얼마나 사라지는지 알 수 없었다. 사유를 뭉뚱그리면 고칠 곳을 못 찾으므로 나눠 센다.
 */
export type LogQueueStats = {
  enqueued: number;
  /** 개별 이벤트가 maxEventBytes를 넘어 버려진 수 */
  droppedOversize: number;
  /** 버퍼가 maxBufferSize를 넘겨 오래된 것부터 버려진 수 */
  droppedOverflow: number;
  /** 토큰 없음/401이라 재시도 의미가 없어 버려진 수 */
  droppedUnauthorized: number;
  /** 서버가 수신한 것으로 확인된 수 */
  sent: number;
  /**
   * 전송 실패로 버퍼에 되돌린 이벤트 수. 재시도할 때마다 누적되므로 원본 이벤트 수보다 클 수 있다.
   * 서버가 적재를 끝낸 뒤 응답만 유실된 경우라면 되돌린 만큼이 그대로 중복 전송이 된다.
   */
  restored: number;
};

const createStats = (): LogQueueStats => ({
  enqueued: 0,
  droppedOversize: 0,
  droppedOverflow: 0,
  droppedUnauthorized: 0,
  sent: 0,
  restored: 0,
});

let stats: LogQueueStats = createStats();

/** 계측 스냅샷. 측정 하네스와 디버깅에서 읽는다. */
export const getLogQueueStats = (): LogQueueStats => ({ ...stats });

declare global {
  interface Window {
    /** 계측 스냅샷을 브라우저에서 읽는 경로. initLogQueue가 등록한다. */
    __logQueueStats?: () => LogQueueStats;
  }
}

export const resetLogQueueStats = () => {
  stats = createStats();
};

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
  stats.droppedOverflow += overflow;
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
 *  로그인 전용(/api/logs AuthGuard) 정책 최적화:
 * - 토큰이 없거나 401이면 더 이상 버퍼링 의미 없음 → 즉시 drop
 */
const shouldDropOnError = (err: unknown): boolean => {
  // logsClient에서 token 없을 때 reject(new Error('Missing appJwt...'))를 던지는 정책을 썼다면 여기서 drop
  if (err instanceof Error && err.message.includes('Missing appJwt')) return true;

  // axios 오류로 401이면(로그인 필요) 버퍼 유지 의미 없음
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return true;
  }
  return false;
};

/**
 * enqueue: 이벤트를 버퍼에 넣고 조건에 따라 flush 트리거
 */
export const enqueueLog = (event: LogEventDto) => {
  if (typeof window === 'undefined') return;

  // 이벤트가 너무 크면 drop (운영 안정성)
  if (approxBytes(event) > config.maxEventBytes) {
    stats.droppedOversize += 1;
    return;
  }

  stats.enqueued += 1;
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
 * - 실패하면
 *   - 401 / token missing: 버퍼 drop (로그인 전용 정책)
 *   - 그 외: 버퍼 복구 + backoff 재시도
 */
export const flush = async () => {
  if (typeof window === 'undefined') return;
  if (flushing) return;
  if (buffer.length === 0) return;

  if (!canFlushNow()) {
    scheduleFlush(Math.max(500, backoffUntil - now()));
    return;
  }

  flushing = true;

  const batch = popBatch();

  try {
    await logsClient.post('/logs', { events: batch });
    stats.sent += batch.length;
    clearBackoff();
  } catch (err) {
    // 로그인 전용이므로 401/토큰없음은 버퍼 의미 없음 -> drop
    if (shouldDropOnError(err)) {
      // drop: batch는 버리고, 남은 buffer만 이어서 처리
      stats.droppedUnauthorized += batch.length;
      clearBackoff();
    } else {
      // 네트워크/서버 오류면 되돌리고 backoff
      stats.restored += batch.length;
      buffer = [...batch, ...buffer];
      dropOldestIfOverflow();
      setBackoff();
    }
  } finally {
    flushing = false;

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
 * 앱 시작 시 1회 호출 권장:
 * - visibilitychange / beforeunload hook
 *
 * NOTE:
 * - /api/logs는 AuthGuard(Authorization 필요)
 * - sendBeacon은 Authorization 헤더를 붙이기 어렵기 때문에 여기서는 사용하지 않음
 * - 대신 visibility hidden 시 flush 시도만 수행(best-effort)
 */
export const initLogQueue = (opts?: Options) => {
  if (typeof window === 'undefined') return () => {};
  if (initialized) return () => {};

  initialized = true;
  config = { ...DEFAULTS, ...(opts ?? {}) };

  // 프로덕션 빌드에서도 유실 수치를 읽어야 측정이 실제 동작을 반영한다.
  window.__logQueueStats = getLogQueueStats;

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      void flush(); // best-effort
    }
  };

  window.addEventListener('visibilitychange', onVisibility);

  return () => {
    initialized = false;
    delete window.__logQueueStats;
    window.removeEventListener('visibilitychange', onVisibility);
    clearFlushTimer();
  };
};
