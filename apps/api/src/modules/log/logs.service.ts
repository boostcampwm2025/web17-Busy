import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type Redis from 'ioredis';

import { CreateLogsReqDto, LogEventDto } from '@repo/dto';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';

const safeDateOrNull = (iso?: string): Date | null => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
};

/**
 * FE/BE 공용 로그 적재(Sink) - Stream Only
 * - Redis Stream에 원천 이벤트만 저장
 * - 트렌딩(ZSET) 갱신은 워커/배치/다른 모듈에서 처리(분리)
 */
@Injectable()
export class LogsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Redis Stream에 원천 로그 적재
   * - meta는 JSON string으로 저장(워커가 파싱)
   * - serverTs는 서버 적재 시각(UTC 기반 처리 권장)
   */
  private async pushToStream(params: {
    userId: string | null;
    serverTs: number;
    event: LogEventDto;
  }) {
    const { userId, serverTs, event } = params;

    const occurredAt = safeDateOrNull(event.occurredAt);
    const metaStr =
      event.meta && typeof event.meta === 'object'
        ? JSON.stringify(event.meta)
        : '';

    await this.redis.xadd(
      REDIS_KEYS.LOG_EVENTS_STREAM,
      '*',
      'serverTs',
      String(serverTs),
      'userId',
      userId ?? '',
      'source',
      event.source ?? '',
      'eventType',
      event.eventType ?? '',
      'sessionId',
      event.sessionId ?? '',
      'method',
      event.method ?? '',
      'path',
      event.path ?? '',
      'statusCode',
      event.statusCode !== undefined ? String(event.statusCode) : '',
      'durationMs',
      event.durationMs !== undefined ? String(event.durationMs) : '',
      'targetPostId',
      event.targetPostId ?? '',
      'targetUserId',
      event.targetUserId ?? '',
      'provider',
      event.provider ?? '',
      'occurredAt',
      occurredAt ? occurredAt.toISOString() : '',
      'meta',
      metaStr,
    );
  }

  async ingest(userId: string, dto: CreateLogsReqDto): Promise<number> {
    const serverTs = Date.now();

    // Stream only: 모든 이벤트를 원천 스트림에 적재
    await Promise.all(
      dto.events.map((e) => this.pushToStream({ userId, serverTs, event: e })),
    );

    return dto.events.length;
  }
}
