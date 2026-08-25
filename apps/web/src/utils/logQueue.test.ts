import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogEventDto } from '@repo/dto';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/api/internal/logsClient', () => ({ logsClient: { post: mocks.post } }));

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

  it('스냅샷은 복사본이라 밖에서 고쳐도 원본이 바뀌지 않는다', async () => {
    const { enqueueLog, getLogQueueStats } = await loadQueue();

    enqueueLog(event());
    const snapshot = getLogQueueStats();
    snapshot.enqueued = 999;

    expect(getLogQueueStats().enqueued).toBe(1);
  });
});
