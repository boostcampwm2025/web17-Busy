import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { TrendingRankStore } from '../rank/trending-rank.store';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import {
  TRENDING_AGGREGATION_INTERVAL,
  TRENDING_CONSUMER_GROUP_NAME,
  TRENDING_STREAM_BATCH_SIZE,
} from '../trending.constants';
import { Cron } from '@nestjs/schedule';
import { XReadGroupReply } from 'src/infra/redis/redis-steam.type';
import { parseTrendingEvent } from '../internal/trending-event.parser';

@Injectable()
export class TrendingStreamConsumer implements OnModuleInit {
  private readonly consumerName = `trending-${process.pid}`;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly rankStore: TrendingRankStore,
  ) {}

  async onModuleInit() {
    await this.ensureGroup();
  }

  private async ensureGroup() {
    try {
      await this.redis.xgroup(
        'CREATE',
        REDIS_KEYS.LOG_EVENTS_STREAM,
        TRENDING_CONSUMER_GROUP_NAME,
        '$',
        'MKSTREAM',
      );
    } catch (e) {
      if (!e?.message?.includes('BUSYGROUP')) throw e;
    }
  }

  @Cron(TRENDING_AGGREGATION_INTERVAL, { waitForCompletion: true })
  async pollAndAggregateOnce() {
    const res = (await this.redis.xreadgroup(
      'GROUP',
      TRENDING_CONSUMER_GROUP_NAME,
      this.consumerName,
      'COUNT',
      TRENDING_STREAM_BATCH_SIZE,
      'STREAMS',
      REDIS_KEYS.LOG_EVENTS_STREAM,
      '>',
    )) as XReadGroupReply;

    if (!res) return;

    const [, entries] = res[0];
    if (!entries?.length) return;

    const pipeline = this.rankStore.pipeline();
    const ackIds: string[] = [];
    const cmdEntryIds: string[] = [];

    for (const [id, kv] of entries) {
      const parsed = parseTrendingEvent(kv);
      if (!parsed) {
        ackIds.push(id);
        continue;
      }

      pipeline.zincrby(REDIS_KEYS.TRENDING_POSTS, parsed.weight, parsed.postId);
      cmdEntryIds.push(id);
    }

    if (cmdEntryIds.length > 0) {
      const pipelineResult = await pipeline.exec();
      if (!pipelineResult) return;

      pipelineResult.forEach(([err], i) => {
        const id = cmdEntryIds[i];
        if (!err) ackIds.push(id);
      });
    }

    if (ackIds.length === 0) return;

    await this.redis.xack(
      REDIS_KEYS.LOG_EVENTS_STREAM,
      TRENDING_CONSUMER_GROUP_NAME,
      ...ackIds,
    );
  }
}
