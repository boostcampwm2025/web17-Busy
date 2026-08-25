import { LogsService } from './logs.service';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import type { LogEventDto } from '@repo/dto';

/** ioredis pipeline은 체이닝 후 exec()으로 결과 배열을 준다. */
const makePipeline = (execResult: [Error | null, unknown][] = []) => {
  const pipeline: any = {
    set: jest.fn().mockReturnThis(),
    xadd: jest.fn().mockReturnThis(),
    incrby: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(execResult),
  };
  return pipeline;
};

const event = (eventId?: string): LogEventDto =>
  ({
    ...(eventId ? { eventId } : {}),
    eventType: 'POST_DETAIL_SUMMARY',
    source: 'fe_ux',
    occurredAt: '2026-01-01T00:00:00.000Z',
  }) as LogEventDto;

const USER_ID = 'user-1';

describe('LogsService 중복 제거', () => {
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
    incrby: jest.fn(),
    pipeline: jest.fn(),
  };
  const privacyService = { getRecentConsents: jest.fn() };

  let service: LogsService;

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue('1'); // 동의 캐시 통과
    service = new LogsService(redis as any, privacyService as any);
  });

  it('처음 보는 이벤트는 스트림에 적재한다', async () => {
    const seenPipeline = makePipeline([[null, 'OK']]);
    const streamPipeline = makePipeline();
    redis.pipeline
      .mockReturnValueOnce(seenPipeline)
      .mockReturnValueOnce(streamPipeline);

    const accepted = await service.ingest(USER_ID, { events: [event('e1')] });

    expect(accepted).toBe(1);
    expect(streamPipeline.xadd).toHaveBeenCalledTimes(1);
    expect(seenPipeline.set).toHaveBeenCalledWith(
      REDIS_KEYS.LOG_EVENT_SEEN('e1'),
      '1',
      'EX',
      expect.any(Number),
      'NX',
    );
  });

  it('이미 받은 이벤트는 적재하지 않고 막은 수를 센다', async () => {
    // NX가 null을 주면 키가 이미 있다는 뜻이다.
    const seenPipeline = makePipeline([[null, null]]);
    redis.pipeline.mockReturnValueOnce(seenPipeline);

    const accepted = await service.ingest(USER_ID, { events: [event('e1')] });

    expect(accepted).toBe(0);
    expect(redis.incrby).toHaveBeenCalledWith(
      REDIS_KEYS.LOG_DUPLICATES_BLOCKED,
      1,
    );
  });

  it('한 배치에 새 이벤트와 중복이 섞이면 새 것만 적재한다', async () => {
    const seenPipeline = makePipeline([
      [null, 'OK'],
      [null, null],
      [null, 'OK'],
    ]);
    const streamPipeline = makePipeline();
    redis.pipeline
      .mockReturnValueOnce(seenPipeline)
      .mockReturnValueOnce(streamPipeline);

    const accepted = await service.ingest(USER_ID, {
      events: [event('e1'), event('e2'), event('e3')],
    });

    expect(accepted).toBe(2);
    expect(streamPipeline.xadd).toHaveBeenCalledTimes(2);
    expect(streamPipeline.incrby).toHaveBeenCalledWith(
      REDIS_KEYS.LOG_DUPLICATES_BLOCKED,
      1,
    );
  });

  it('식별자가 없는 이벤트는 판별하지 않고 통과시킨다', async () => {
    const streamPipeline = makePipeline();
    redis.pipeline.mockReturnValueOnce(streamPipeline);

    const accepted = await service.ingest(USER_ID, {
      events: [event(), event()],
    });

    // 판별용 pipeline 자체를 만들지 않는다
    expect(redis.pipeline).toHaveBeenCalledTimes(1);
    expect(accepted).toBe(2);
    expect(streamPipeline.xadd).toHaveBeenCalledTimes(2);
  });

  it('Redis 판별이 실패하면 막지 않고 통과시킨다', async () => {
    // 유실보다 중복이 낫다는 판단이다.
    const seenPipeline = makePipeline([[new Error('redis down'), null]]);
    const streamPipeline = makePipeline();
    redis.pipeline
      .mockReturnValueOnce(seenPipeline)
      .mockReturnValueOnce(streamPipeline);

    const accepted = await service.ingest(USER_ID, { events: [event('e1')] });

    expect(accepted).toBe(1);
    expect(streamPipeline.xadd).toHaveBeenCalledTimes(1);
  });

  it('이벤트가 여러 건이어도 스트림 적재는 한 번만 왕복한다', async () => {
    const seenPipeline = makePipeline([
      [null, 'OK'],
      [null, 'OK'],
      [null, 'OK'],
    ]);
    const streamPipeline = makePipeline();
    redis.pipeline
      .mockReturnValueOnce(seenPipeline)
      .mockReturnValueOnce(streamPipeline);

    await service.ingest(USER_ID, {
      events: [event('e1'), event('e2'), event('e3')],
    });

    expect(streamPipeline.xadd).toHaveBeenCalledTimes(3);
    expect(streamPipeline.exec).toHaveBeenCalledTimes(1);
  });

  it('동의하지 않은 사용자면 아무것도 적재하지 않는다', async () => {
    redis.get.mockResolvedValue('0');

    const accepted = await service.ingest(USER_ID, { events: [event('e1')] });

    expect(accepted).toBe(0);
    expect(redis.pipeline).not.toHaveBeenCalled();
  });
});
