import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogEventDto } from '@repo/dto';
import { APP_ACCESS_TOKEN_STORAGE_KEY } from '@/constants/auth';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/api/internal/logsClient', () => ({
  logsClient: { post: mocks.post, defaults: { baseURL: '/api' } },
}));

/** 버퍼·카운터가 모듈 스코프라 테스트마다 새로 읽어야 서로 간섭하지 않는다. */
const loadQueue = async () => {
  vi.resetModules();
  return import('./logQueue');
};

const event = (overrides: Partial<LogEventDto> = {}): LogEventDto =>
  ({
    eventType: 'POST_DETAIL_SUMMARY',
    source: 'fe_ux',
    occurredAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as LogEventDto;

const FLUSH_SIZE = 20;
const MAX_BUFFER_SIZE = 200;

describe('logQueue 유실 계측', () => {
  beforeEach(() => {
    mocks.post.mockReset();
  });

  it('전송에 성공하면 보낸 건수를 센다', async () => {
    mocks.post.mockResolvedValue({ data: {} });
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    for (let i = 0; i < FLUSH_SIZE; i += 1) enqueueLog(event());

    await vi.waitFor(() => expect(getLogQueueStats().sent).toBe(FLUSH_SIZE));
    expect(getLogQueueStats().enqueued).toBe(FLUSH_SIZE);
  });

  it('이벤트 하나가 크기 상한을 넘으면 사유를 남기고 버린다', async () => {
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    enqueueLog(event({ meta: { blob: 'x'.repeat(9_000) } }));

    const stats = getLogQueueStats();
    expect(stats.droppedOversize).toBe(1);
    expect(stats.enqueued).toBe(0); // 버퍼에 들어가지도 않는다
  });

  it('버퍼가 상한을 넘으면 넘친 만큼 버린 것을 센다', async () => {
    // 응답이 오지 않으면 flushing이 풀리지 않아 버퍼만 쌓인다. 넘침 상황을 만든다.
    mocks.post.mockReturnValue(new Promise(() => {}));
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    for (let i = 0; i < FLUSH_SIZE; i += 1) enqueueLog(event()); // 첫 배치가 빠져나가며 전송이 멈춘다
    const overflowBy = 5;
    for (let i = 0; i < MAX_BUFFER_SIZE + overflowBy; i += 1) enqueueLog(event());

    expect(getLogQueueStats().droppedOverflow).toBe(overflowBy);
  });

  it('토큰이 없으면 재시도하지 않고 버린 것을 센다', async () => {
    mocks.post.mockRejectedValue(new Error('Missing appJwt for /api/logs'));
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    for (let i = 0; i < FLUSH_SIZE; i += 1) enqueueLog(event());

    await vi.waitFor(() => expect(getLogQueueStats().droppedUnauthorized).toBe(FLUSH_SIZE));
    expect(getLogQueueStats().sent).toBe(0);
  });

  it('전송에 실패해 버퍼로 되돌린 건수를 센다', async () => {
    mocks.post.mockRejectedValue(new Error('Network Error'));
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    for (let i = 0; i < FLUSH_SIZE; i += 1) enqueueLog(event());

    // 되돌린 건수는 서버가 이미 적재했을 경우 그대로 중복이 된다.
    await vi.waitFor(() => expect(getLogQueueStats().restored).toBe(FLUSH_SIZE));
    expect(getLogQueueStats().sent).toBe(0);
  });

  it('이벤트마다 중복 제거용 식별자를 붙여 보낸다', async () => {
    mocks.post.mockResolvedValue({ data: {} });
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    for (let i = 0; i < FLUSH_SIZE; i += 1) enqueueLog(event());

    await vi.waitFor(() => expect(getLogQueueStats().sent).toBe(FLUSH_SIZE));

    const events = (mocks.post.mock.calls[0]?.[1] as { events: { eventId?: string }[] }).events;
    const ids = events.map((e) => e.eventId);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(FLUSH_SIZE); // 이벤트마다 서로 달라야 한다
  });

  it('이미 식별자가 있으면 새로 붙이지 않는다', async () => {
    mocks.post.mockResolvedValue({ data: {} });
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    // 재시도로 다시 들어와도 같은 식별자를 유지해야 서버가 중복을 알아본다.
    enqueueLog(event({ eventId: 'fixed-id' }));
    for (let i = 1; i < FLUSH_SIZE; i += 1) enqueueLog(event());

    await vi.waitFor(() => expect(getLogQueueStats().sent).toBe(FLUSH_SIZE));

    const events = (mocks.post.mock.calls[0]?.[1] as { events: { eventId?: string }[] }).events;
    expect(events[0]?.eventId).toBe('fixed-id');
  });

  it('스냅샷은 복사본이라 밖에서 고쳐도 원본이 바뀌지 않는다', async () => {
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    enqueueLog(event());
    const snapshot = getLogQueueStats();
    snapshot.enqueued = 999;

    expect(getLogQueueStats().enqueued).toBe(1);
  });
});

describe('logQueue 종료 시점(pagehide) keepalive 전송', () => {
  beforeEach(() => {
    mocks.post.mockReset();
    sessionStorage.clear();
    sessionStorage.setItem(APP_ACCESS_TOKEN_STORAGE_KEY, 'app-jwt-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pagehide 시점에는 keepalive fetch로 보내고 시도 건수를 센다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', fetchMock);

    const { enqueueLog, initLogQueue, getLogQueueStats } = await loadQueue();
    const teardown = initLogQueue();

    enqueueLog(event());
    window.dispatchEvent(new Event('pagehide'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/logs');
    expect(init.keepalive).toBe(true);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer app-jwt-token');
    expect(getLogQueueStats().sentOnTerminate).toBe(1);

    teardown();
  });

  it('토큰이 없으면 시도하지 않는다', async () => {
    sessionStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { enqueueLog, initLogQueue, getLogQueueStats } = await loadQueue();
    const teardown = initLogQueue();

    enqueueLog(event());
    window.dispatchEvent(new Event('pagehide'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getLogQueueStats().sentOnTerminate).toBe(0);

    teardown();
  });

  it('예산(약 60KB)을 넘는 만큼은 보내지 않고 버퍼에 남긴다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', fetchMock);

    const { enqueueLog, initLogQueue, getLogQueueStats, flush } = await loadQueue();
    const teardown = initLogQueue();

    // 이벤트 하나당 대략 7KB, 10개면 70KB로 예산(60KB)을 넘는다.
    for (let i = 0; i < 10; i += 1) enqueueLog(event({ meta: { blob: 'x'.repeat(7_000) } }));

    window.dispatchEvent(new Event('pagehide'));

    const body = (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string;
    const sentCount = (JSON.parse(body) as { events: unknown[] }).events.length;

    expect(sentCount).toBeGreaterThan(0);
    expect(sentCount).toBeLessThan(10); // 전부는 못 담아 일부는 버퍼에 남아야 한다
    expect(getLogQueueStats().sentOnTerminate).toBe(sentCount);

    // 남은 만큼은 버퍼에 그대로 있어야 다음 flush로 이어 보낼 수 있다.
    mocks.post.mockResolvedValue({ data: {} });
    await flush();
    await vi.waitFor(() => expect(getLogQueueStats().sent).toBe(10 - sentCount));

    teardown();
  });
});
