import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';

@Injectable()
export class TrendingRankStore {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  incrPostScore(postId: string, weight: number) {
    return this.redis.zincrby(REDIS_KEYS.TRENDING_POSTS, weight, postId);
  }

  getTopWithScores(start: number, end: number) {
    return this.redis.zrevrange(
      REDIS_KEYS.TRENDING_POSTS,
      start,
      end,
      'WITHSCORES',
    );
  }

  scan(cursor: string, count: number) {
    return this.redis.zscan(REDIS_KEYS.TRENDING_POSTS, cursor, 'COUNT', count);
  }

  remove(postId: string) {
    return this.redis.zrem(REDIS_KEYS.TRENDING_POSTS, postId);
  }

  setScore(postId: string, score: number) {
    return this.redis.zadd(REDIS_KEYS.TRENDING_POSTS, score, postId);
  }

  pipeline() {
    return this.redis.pipeline();
  }

  getByMaxScoreExclusiveRaw(maxScoreExclusive?: number, cap = 2000) {
    const max =
      maxScoreExclusive === undefined ? '+inf' : `(${maxScoreExclusive}`;

    return this.redis.zrevrangebyscore(
      REDIS_KEYS.TRENDING_POSTS,
      max,
      '-inf',
      'WITHSCORES',
      'LIMIT',
      0,
      cap,
    );
  }

  getByMaxScoreRaw(maxScore?: number, cap = 2000) {
    const max = maxScore === undefined ? '+inf' : `${maxScore}`;

    return this.redis.zrevrangebyscore(
      REDIS_KEYS.TRENDING_POSTS,
      max,
      '-inf',
      'WITHSCORES',
      'LIMIT',
      0,
      cap,
    );
  }
}
