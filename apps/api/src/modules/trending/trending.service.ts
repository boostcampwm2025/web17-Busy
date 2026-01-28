import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import {
  TRENDING_AGGREGATION_INTERVAL,
  TRENDING_CONSUMER_GROUP_NAME,
  TRENDING_DECAY_FACTOR,
  TRENDING_DECAY_INTERVAL,
  TRENDING_DECAY_SCAN_BATCH_SIZE,
  TRENDING_MIN_SCORE,
  TRENDING_STREAM_BATCH_SIZE,
  TRENDING_WEIGHTS,
  TrendingInteractionType,
} from './trending.constants';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { XReadGroupReply } from 'src/infra/redis/redis-steam.type';
import { kvToObj } from 'src/infra/redis/redis-stream.util';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TrendingService implements OnModuleInit {
  private readonly consumerName = `trending-${process.pid}`;

  constructor(@InjectRedis() private readonly redis: Redis) {}

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
    } catch (e: any) {
      if (!e.message.includes('BUSYGROUP')) throw e;
    }
  }

  @Cron(TRENDING_AGGREGATION_INTERVAL, { waitForCompletion: true })
  async updateTrendingPostsFromStream() {
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

    const [_, entries] = res[0];
    if (!entries?.length) return;

    const pipeline = this.redis.pipeline();
    const ackIds: string[] = [];
    const cmdEntryIds: string[] = [];

    for (const [id, kv] of entries) {
      const event = kvToObj(kv);

      const eventType = event.eventType as TrendingInteractionType | undefined;
      const targetPostId = event.targetPostId;
      const weight = eventType ? TRENDING_WEIGHTS[eventType] : undefined;

      if (!eventType || !targetPostId?.trim() || weight === undefined) {
        ackIds.push(id);
        continue;
      }

      pipeline.zincrby(REDIS_KEYS.TRENDING_POSTS, weight, targetPostId);
      cmdEntryIds.push(id);
    }

    const hasCmd = cmdEntryIds.length > 0;
    if (hasCmd) {
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

  @Cron(TRENDING_DECAY_INTERVAL, { waitForCompletion: true })
  async decayTrendingScores() {
    let cursor = '0';

    do {
      const [nextCursor, items] = await this.redis.zscan(
        REDIS_KEYS.TRENDING_POSTS,
        cursor,
        'COUNT',
        TRENDING_DECAY_SCAN_BATCH_SIZE,
      );

      cursor = nextCursor;

      if (!items.length) continue;

      const pipeline = this.redis.pipeline();

      for (let i = 0; i < items.length; i += 2) {
        const postId = items[i];
        const score = Number(items[i + 1]);

        const newScore = score * TRENDING_DECAY_FACTOR;

        if (newScore < TRENDING_MIN_SCORE) {
          pipeline.zrem(REDIS_KEYS.TRENDING_POSTS, postId);
        } else {
          pipeline.zadd(REDIS_KEYS.TRENDING_POSTS, newScore, postId);
        }
      }

      await pipeline.exec();
    } while (cursor !== '0');
  }

  async getTop(limit = 10) {
    const raw = await this.redis.zrevrange(
      REDIS_KEYS.TRENDING_POSTS,
      0,
      Math.max(9, limit - 1),
      'WITHSCORES',
    );

    const result: Array<{ postId: string; score: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      result.push({ postId: raw[i], score: Number(raw[i + 1]) });
    }
    return result;
  }
}
