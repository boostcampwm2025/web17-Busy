import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import {
  TRENDING_CONSUMER_GROUP_NAME,
  TRENDING_WEIGHTS,
  TrendingInteractionType,
} from './trending.constants';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { XReadGroupReply } from 'src/infra/redis/redis-steam.type';
import { kvToObj } from 'src/infra/redis/redis-stream.util';

@Injectable()
export class TrendingService implements OnModuleInit {
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

  private async updateTrendingPostsFromStream() {
    const res = (await this.redis.xreadgroup(
      'GROUP',
      TRENDING_CONSUMER_GROUP_NAME,
      'worker-1',
      'COUNT',
      500,
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

    entries
      .map(([id, kv]) => ({
        id: id,
        event: kvToObj(kv),
      }))
      .forEach(({ id, event }) => {
        const eventType = event.eventType as
          | TrendingInteractionType
          | undefined;
        const targetPostId = event.targetPostId;
        const weight = eventType ? TRENDING_WEIGHTS[eventType] : undefined;

        if (!eventType || !targetPostId?.trim() || weight === undefined) {
          ackIds.push(id);
          return;
        }

        pipeline.zincrby(REDIS_KEYS.TRENDING_POSTS, weight, targetPostId);
        cmdEntryIds.push(id);
      });

    const pipelineResult = await pipeline.exec();
    if (!pipelineResult) return;

    pipelineResult.forEach(([err], i) => {
      const id = cmdEntryIds[i];
      if (!err) ackIds.push(id);
    });

    if (ackIds.length === 0) return;

    await this.redis.xack(
      REDIS_KEYS.LOG_EVENTS_STREAM,
      TRENDING_CONSUMER_GROUP_NAME,
      ...ackIds,
    );
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
