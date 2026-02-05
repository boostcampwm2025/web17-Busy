import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { AlgorithmService } from './algorithm.service';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StreamEntry, XAutoClaimReply } from 'src/infra/redis/redis-steam.type';

export interface GraphRelation {
  userId: string;
  targetId: string;
  targetLabel: 'User' | 'Content' | 'Music';
  relationType: string;
  action: 'ADD' | 'REMOVE';
  weight: number;
  props: Record<string, any>;
}

type XReadGroupReply = [string, [string, string[]][]][];

@Injectable()
export class AlgorithmStreamConsumer implements OnModuleInit {
  private readonly logger = new Logger(AlgorithmStreamConsumer.name);
  private readonly consumerName = `algo-${process.pid}`;

  private readonly CONSUMER_GROUP = 'algorithm-group';
  private readonly BATCH_SIZE = 500;

  private reclaimTick = 0;
  private readonly RECLAIM_INTERVAL_TICKS = 5;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly algorithmService: AlgorithmService,
  ) {}

  async onModuleInit() {
    await this.ensureGroup();
  }

  private async ensureGroup() {
    try {
      await this.redis.xgroup(
        'CREATE',
        REDIS_KEYS.LOG_EVENTS_STREAM,
        this.CONSUMER_GROUP,
        '$',
        'MKSTREAM',
      );
    } catch (e) {
      if (!e?.message?.includes('BUSYGROUP')) {
        this.logger.error('Failed to create consumer group', e);
      }
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { waitForCompletion: true })
  async pollAndProcess() {
    while (true) {
      const entries = await this.readNewEntriesOnce();
      if (entries.length === 0) break;

      const result = await this.processEntriesAndAck(entries);

      if (!result.ok) break;
      if (entries.length < this.BATCH_SIZE) break;
    }

    await this.reclaimPendingOnce();
  }

  private async readNewEntriesOnce(): Promise<StreamEntry[]> {
    const res = (await this.redis.xreadgroup(
      'GROUP',
      this.CONSUMER_GROUP,
      this.consumerName,
      'COUNT',
      this.BATCH_SIZE,
      'BLOCK',
      3000,
      'STREAMS',
      REDIS_KEYS.LOG_EVENTS_STREAM,
      '>',
    )) as XReadGroupReply;

    if (!res || !res[0] || !res[0][1]?.length) return [];
    return res[0][1] as StreamEntry[];
  }

  async reclaimPendingOnce() {
    const { entries } = await this.autoClaimPendingOnce({
      minIdleTimeMs: 5 * 60_000,
      count: this.BATCH_SIZE,
      startId: '0-0',
    });

    if (entries.length === 0) return;

    await this.processEntriesAndAck(entries);
  }

  private async autoClaimPendingOnce(params?: {
    minIdleTimeMs?: number;
    count?: number;
    startId: string;
  }): Promise<{ nextStartId: string; entries: StreamEntry[] }> {
    const minIdleTimeMs = params?.minIdleTimeMs ?? 5 * 60_000;
    const count = params?.count ?? this.BATCH_SIZE ?? 100;
    const startId = params?.startId ?? '0-0';

    const [nextStartId, entries] = (await this.redis.xautoclaim(
      REDIS_KEYS.LOG_EVENTS_STREAM,
      this.CONSUMER_GROUP,
      this.consumerName,
      minIdleTimeMs,
      startId,
      'COUNT',
      count,
    )) as XAutoClaimReply;

    return { nextStartId, entries };
  }

  private async processEntriesAndAck(entries: StreamEntry[]) {
    // 1개의 로그 → 여러 관계가 될 수 있으니 평탄화
    const batchToAdd: GraphRelation[] = [];
    const batchToRemove: GraphRelation[] = [];

    const validIds: string[] = [];
    const skipIds: string[] = [];

    for (const [id, fields] of entries) {
      const parsedRelations = this.parseToGraphData(fields);

      if (!parsedRelations || parsedRelations.length === 0) {
        skipIds.push(id); // 파싱 불가/의미 없음 → ACK해서 PEL 무한 증가 방지
        continue;
      }

      for (const rel of parsedRelations) {
        if (rel.action === 'REMOVE') batchToRemove.push(rel);
        else batchToAdd.push(rel);
      }

      validIds.push(id);
    }

    try {
      if (batchToAdd.length > 0) {
        await this.algorithmService.addRelationshipsBatch(batchToAdd);
      }

      if (batchToRemove.length > 0) {
        await this.algorithmService.removeRelationshipsBatch(batchToRemove);
      }

      if (batchToAdd.length > 0 || batchToRemove.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 성공한 것 + 스킵한 것은 ACK
      const idsToAck = [...validIds, ...skipIds];
      if (idsToAck.length > 0) {
        await this.redis.xack(
          REDIS_KEYS.LOG_EVENTS_STREAM,
          this.CONSUMER_GROUP,
          ...idsToAck,
        );
      }

      return { ok: true as const, acked: validIds.length + skipIds.length };
    } catch (error) {
      this.logger.error('Failed to sync to Neo4j', error);

      // DB 에러 시에도 파싱 불가(스킵)만 ACK → 무한루프 방지
      if (skipIds.length > 0) {
        await this.redis.xack(
          REDIS_KEYS.LOG_EVENTS_STREAM,
          this.CONSUMER_GROUP,
          ...skipIds,
        );
      }

      return { ok: false as const, acked: skipIds.length };
    }
  }

  /**
   * Redis 필드를 파싱하여 1개 이상의 GraphRelation 객체 배열로 반환
   */
  private parseToGraphData(fields: string[]): GraphRelation[] | null {
    const log: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      log[fields[i]] = fields[i + 1];
    }

    const { userId, eventType, targetPostId, targetUserId, meta, serverTs } =
      log;
    if (!userId || !eventType) return null;

    let parsedMeta: any = {};
    try {
      parsedMeta = meta ? JSON.parse(meta) : {};
    } catch {
      parsedMeta = {};
    }

    const timestamp = serverTs
      ? new Date(Number(serverTs)).toISOString()
      : new Date().toISOString();

    const results: GraphRelation[] = [];

    // --- 1) FE UX: 상세 조회 (Content View + Music Listen) ---
    if (eventType === 'POST_DETAIL_SUMMARY' && targetPostId) {
      const dwellMs = parsedMeta.dwellMs || 0;
      // 게시글 조회 가중치: 기본 1점 + 10초당 1점 추가
      const viewWeight = 1 + Math.floor(dwellMs / 10000);

      results.push({
        userId,
        targetId: targetPostId,
        targetLabel: 'Content',
        relationType: 'VIEWED',
        action: 'ADD',
        weight: viewWeight,
        props: { timestamp, dwellMs },
      });

      // 음악 청취 내역이 있으면 별도 관계로 추가 (1:N)
      if (
        parsedMeta.listenMsByMusic &&
        typeof parsedMeta.listenMsByMusic === 'object'
      ) {
        Object.entries(parsedMeta.listenMsByMusic).forEach(([musicId, ms]) => {
          const listenMs = Number(ms);
          // 음악 가중치: 기본 1점 + 10초당 1점 추가
          const listenWeight = 1 + Math.floor(listenMs / 1000);

          results.push({
            userId,
            targetId: targetPostId,
            targetLabel: 'Content',
            relationType: 'LISTENED',
            action: 'ADD',
            weight: listenWeight,
            props: { timestamp, duration: listenMs, sourceMusicId: musicId },
          });
        });
      }
    }

    // --- 2) BE: 좋아요 (ADD / REMOVE) ---
    else if (eventType === 'LIKE_ADD' && targetPostId) {
      results.push({
        userId,
        targetId: targetPostId,
        targetLabel: 'Content',
        relationType: 'LIKED',
        action: 'ADD',
        weight: 5,
        props: { timestamp },
      });
    } else if (eventType === 'LIKE_REMOVE' && targetPostId) {
      results.push({
        userId,
        targetId: targetPostId,
        targetLabel: 'Content',
        relationType: 'LIKED',
        action: 'REMOVE',
        weight: 0,
        props: {},
      });
    }

    // --- 3) BE: 팔로우 (ADD / REMOVE) ---
    else if (eventType === 'FOLLOW_ADD' && targetUserId) {
      results.push({
        userId,
        targetId: targetUserId,
        targetLabel: 'User',
        relationType: 'FOLLOWS',
        action: 'ADD',
        weight: 10, // 팔로우 10점
        props: { timestamp },
      });
    } else if (eventType === 'FOLLOW_REMOVE' && targetUserId) {
      results.push({
        userId,
        targetId: targetUserId,
        targetLabel: 'User',
        relationType: 'FOLLOWS',
        action: 'REMOVE',
        weight: 0,
        props: {},
      });
    }

    // --- 4) BE: 댓글 ---
    else if (eventType === 'COMMENT_CREATE' && targetPostId) {
      results.push({
        userId,
        targetId: targetPostId,
        targetLabel: 'Content',
        relationType: 'COMMENTED',
        action: 'ADD',
        weight: 3, // 댓글 3점
        props: { timestamp, length: parsedMeta.length },
      });
    }

    return results.length > 0 ? results : null;
  }
}
