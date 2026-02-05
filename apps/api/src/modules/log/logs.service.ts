import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type Redis from 'ioredis';

import { CreateLogsReqDto, LogEventDto } from '@repo/dto';
import { ConsentType } from '@repo/dto/values';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { PrivacyService } from 'src/modules/privacy/privacy.service';

const safeDateOrNull = (iso?: string): Date | null => {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
};

const CONSENT_CACHE_TTL_SEC = 300; // 5분(필요시 조정)
const consentCacheKey = (userId: string) => `consent:log:${userId}`;
const LOG_STREAM_MAXLEN = 20_000;

/**
 * FE/BE 공용 로그 적재(Sink) - Stream Only
 * - Redis Stream에 원천 이벤트만 저장
 * - 트렌딩(ZSET) 갱신은 워커/배치/다른 모듈에서 처리(분리)
 */
@Injectable()
export class LogsService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly privacyService: PrivacyService,
  ) {}

  private async hasLogConsent(userId: string): Promise<boolean> {
    // 1) Redis 캐시 먼저
    const cached = await this.redis.get(consentCacheKey(userId));
    if (cached === '1') return true;
    if (cached === '0') return false;

    // 2) DB 기반 최신 동의 조회
    const { items } = await this.privacyService.getRecentConsents(userId);

    const map = new Map(items.map((i) => [i.type, i.agreed]));
    const ok =
      map.get(ConsentType.TERMS_OF_SERVICE) === true &&
      map.get(ConsentType.PRIVACY_POLICY) === true;

    // 3) 캐시 저장(짧은 TTL)
    await this.redis.set(
      consentCacheKey(userId),
      ok ? '1' : '0',
      'EX',
      CONSENT_CACHE_TTL_SEC,
    );

    return ok;
  }

  /**
   * Redis Stream에 원천 로그 적재
   * - meta는 JSON string으로 저장(워커가 파싱)
   * - serverTs는 서버 적재 시각(UTC 기반 처리 권장)
   */

  private async pushToStream(params: {
    userId: string;
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
      'MAXLEN',
      '~',
      LOG_STREAM_MAXLEN,
      '*',
      'serverTs',
      String(serverTs),
      'userId',
      userId,
      'source',
      event.source ?? '',
      'eventType',
      event.eventType ?? '',
      // sessionId는 optional이므로 없으면 빈 문자열로 (stream field는 문자열)
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
    // 동의 없으면 drop
    const ok = await this.hasLogConsent(userId);
    if (!ok) return 0;

    const serverTs = Date.now();
    // Stream only: 모든 이벤트를 원천 스트림에 적재
    await Promise.all(
      dto.events.map((e) => this.pushToStream({ userId, serverTs, event: e })),
    );
    return dto.events.length;
  }
}
