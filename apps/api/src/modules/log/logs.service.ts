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
 * 이벤트 식별자를 기억해 두는 기간.
 * FE 버퍼는 페이지가 열려 있는 내내 유지되고 백오프도 최대 16초까지 늘어나므로,
 * 재시도가 이 창 안에 들어오도록 넉넉히 잡는다.
 */
const EVENT_SEEN_TTL_SEC = 60 * 60;

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

  private streamPushArgs(params: {
    userId: string;
    serverTs: number;
    event: LogEventDto;
  }): string[] {
    const { userId, serverTs, event } = params;

    const occurredAt = safeDateOrNull(event.occurredAt);
    const metaStr =
      event.meta && typeof event.meta === 'object'
        ? JSON.stringify(event.meta)
        : '';

    return [
      REDIS_KEYS.LOG_EVENTS_STREAM,
      'MAXLEN',
      '~',
      String(LOG_STREAM_MAXLEN),
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
      'eventId',
      event.eventId ?? '',
      'meta',
      metaStr,
    ];
  }

  /**
   * 이미 받은 이벤트를 걸러낸다.
   *
   * 식별자가 없는 이벤트(배포 과도기의 옛 번들)는 판별할 방법이 없으니 그대로 통과시킨다.
   * Redis 판별이 실패한 경우에도 통과시킨다 — 유실보다 중복이 낫다.
   */
  private async rejectAlreadySeen(
    events: LogEventDto[],
  ): Promise<{ fresh: LogEventDto[]; blocked: number }> {
    const identified = events.filter(
      (event): event is LogEventDto & { eventId: string } => !!event.eventId,
    );
    if (identified.length === 0) return { fresh: events, blocked: 0 };

    const pipeline = this.redis.pipeline();
    for (const event of identified) {
      pipeline.set(
        REDIS_KEYS.LOG_EVENT_SEEN(event.eventId),
        '1',
        'EX',
        EVENT_SEEN_TTL_SEC,
        'NX',
      );
    }
    const results = await pipeline.exec();

    const seenBefore = new Set<string>();
    identified.forEach((event, index) => {
      const entry = results?.[index];
      if (!entry) return; // 판별 결과가 없으면 통과
      const [err, value] = entry;
      if (err) return; // Redis 오류면 통과
      // NX는 처음 보는 키에만 'OK'를 준다. null이면 이미 받은 이벤트다.
      if (value !== 'OK') seenBefore.add(event.eventId);
    });

    if (seenBefore.size === 0) return { fresh: events, blocked: 0 };

    return {
      fresh: events.filter(
        (event) => !event.eventId || !seenBefore.has(event.eventId),
      ),
      blocked: seenBefore.size,
    };
  }

  async ingest(userId: string, dto: CreateLogsReqDto): Promise<number> {
    // 동의 없으면 drop
    const ok = await this.hasLogConsent(userId);
    if (!ok) return 0;

    const { fresh, blocked } = await this.rejectAlreadySeen(dto.events);
    if (fresh.length === 0) {
      if (blocked > 0) await this.countBlockedDuplicates(blocked);
      return 0;
    }

    const serverTs = Date.now();
    // Stream only: 모든 이벤트를 원천 스트림에 적재.
    // 이벤트마다 왕복하면 중복 판별까지 더해져 왕복이 2N이 되므로 한 번에 묶어 보낸다.
    const pipeline = this.redis.pipeline();
    for (const event of fresh) {
      const args = this.streamPushArgs({ userId, serverTs, event });
      pipeline.xadd(...(args as [string, ...string[]]));
    }
    if (blocked > 0) {
      pipeline.incrby(REDIS_KEYS.LOG_DUPLICATES_BLOCKED, blocked);
    }
    await pipeline.exec();

    return fresh.length;
  }

  private async countBlockedDuplicates(blocked: number) {
    await this.redis.incrby(REDIS_KEYS.LOG_DUPLICATES_BLOCKED, blocked);
  }
}
