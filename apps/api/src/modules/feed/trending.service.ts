import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  TRENDING_WEIGHTS,
  TrendingInteractionType,
} from './trending.constants';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';

@Injectable()
export class TrendingService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async addInteraction(postId: string, type: TrendingInteractionType) {
    const w = TRENDING_WEIGHTS[type];

    await this.redis.zincrby(REDIS_KEYS.TRENDING_POSTS, w, postId);
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
