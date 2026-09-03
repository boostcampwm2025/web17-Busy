import type { LogEventDto } from '@repo/dto';
import { getAppAccessToken } from '@/api/auth-token';
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

/**
 * fetch keepalive 요청은 페이지의 모든 keepalive 요청이 공유하는 전역 예산(대략 64KB)이 있어
 * 이를 넘으면 요청 자체가 거부된다. 헤더·JSON 구조 오버헤드와 동시에 떠 있을 수 있는 다른
 * keepalive 요청을 감안해 여유 있게 낮춰 잡는다.
 */
const TERMINATE_MAX_BYTES = 60_000;

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
  /**
   * 종료 시점(pagehide) keepalive 전송을 시도한 수. keepalive는 페이지가 사라진 뒤라 응답을
   * 기다릴 수 없어 서버 수신을 확인할 수 없다 — sent와 분리해서, 실제 성공률은 서버 수신 로그와
   * 대조해야 알 수 있다는 걸 수치로도 드러낸다.
   */
  sentOnTerminate: number;
};

const createStats = (): LogQueueStats => ({
  enqueued: 0,
  droppedOversize: 0,
  droppedOverflow: 0,
  droppedUnauthorized: 0,
  sent: 0,
  restored: 0,
  sentOnTerminate: 0,
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

/**
 * 중복 제거용 식별자.
 * `crypto.randomUUID`는 보안 컨텍스트(https/localhost)에서만 있으므로 대비해 둔다.
 * 키가 없으면 서버가 중복을 못 걸러낼 뿐 전송 자체는 되므로, 실패해도 이벤트를 버리지는 않는다.
 */
const createEventId = (): string | undefined => {
  try {
    if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  } catch {
    return undefined;
  }
};

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
 * 앞에서부터 TERMINATE_MAX_BYTES 예산 안에 들어오는 만큼만 담는다.
 * 예산을 넘는 나머지는 버퍼에 남는다 — 페이지가 실제로 파괴되면 그대로 유실되고, 이 함수
 * 안에서는 그걸 막을 방법이 없다(더 보낼 곳도, 더 기다릴 시간도 없다).
 */
const popTerminationBatch = (): LogEventDto[] => {
  let bytes = 2; // '[]'
  let count = 0;

  for (const evt of buffer) {
    const eventBytes = approxBytes(evt) + (count > 0 ? 1 : 0); // ','로 이어붙는 만큼
    if (bytes + eventBytes > TERMINATE_MAX_BYTES) break;
    bytes += eventBytes;
    count += 1;
  }

  const batch = buffer.slice(0, count);
  buffer = buffer.slice(count);
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

  // 재시도로 같은 이벤트가 여러 번 도착해도 서버가 걸러낼 수 있도록 여기서 한 번만 붙인다.
  const identified: LogEventDto = event.eventId ? event : { ...event, eventId: createEventId() };

  // 이벤트가 너무 크면 drop (운영 안정성)
  if (approxBytes(identified) > config.maxEventBytes) {
    stats.droppedOversize += 1;
    return;
  }

  stats.enqueued += 1;
  buffer.push(identified);
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
 * 탭 종료(또는 종료에 가까운) 시점 전용 flush.
 * 일반 flush()는 axios.post라 요청 시작만 보장하고, 페이지가 파괴되면 완료를 기다릴 수 없다.
 * fetch keepalive는 페이지가 사라져도 브라우저가 전송을 이어가 주지만, 응답을 기다릴 수
 * 없어(페이지가 이미 없을 수 있으므로) 실패해도 재시도·버퍼 복구를 할 수 없는 일회성 시도다.
 * sendBeacon 대신 이걸 쓰는 이유는 Authorization 헤더가 필요한 AuthGuard 엔드포인트라서다.
 */
const flushOnTerminate = () => {
  if (typeof window === 'undefined') return;
  if (typeof fetch !== 'function') return;
  if (buffer.length === 0) return;

  const token = getAppAccessToken();
  if (!token) return; // 로그인 전용 정책: 토큰 없으면 시도하지 않는다

  const batch = popTerminationBatch();
  if (batch.length === 0) return; // 첫 이벤트조차 예산을 넘는 극단적인 경우

  try {
    fetch(`${logsClient.defaults.baseURL}/logs`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events: batch }),
    }).catch(() => {
      // 페이지가 이미 파괴된 뒤일 수 있어 여기서 할 수 있는 재시도가 없다.
    });
    stats.sentOnTerminate += batch.length;
  } catch {
    // 브라우저의 keepalive 전역 예산 초과 등으로 fetch 자체가 동기적으로 던지는 경우.
    // 이미 버퍼에서 뺀 배치를 그대로 잃지 않도록 앞쪽에 되돌린다.
    buffer = [...batch, ...buffer];
    stats.restored += batch.length;
  }
};

/**
 * 앱 시작 시 1회 호출 권장.
 *
 * - visibilitychange(hidden): 탭을 배경으로 전환하는 경우 페이지가 살아있으므로,
 *   재시도 가능한 일반 flush()로 충분하다.
 * - pagehide: visibilitychange보다 실제 파괴 시점에 더 가까운 마지막 기회다. 탭을 즉시
 *   닫는 경우 flush()의 axios.post는 완료를 못 기다리고 끊길 수 있어, 응답을 기다리지 않는
 *   flushOnTerminate()(keepalive)를 여기서 한 번 더 시도한다.
 * - /api/logs는 AuthGuard(Authorization 필요)라 sendBeacon(헤더 불가)은 쓰지 않는다.
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

  const onPageHide = () => {
    flushOnTerminate();
  };

  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  return () => {
    initialized = false;
    delete window.__logQueueStats;
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    clearFlushTimer();
  };
};
