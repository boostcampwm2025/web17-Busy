import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  TRENDING_DECAY_FACTOR,
  TRENDING_DECAY_INTERVAL,
  TRENDING_DECAY_SCAN_BATCH_SIZE,
  TRENDING_MIN_SCORE,
} from '../trending.constants';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { TrendingRankStore } from '../rank/trending-rank.store';

@Injectable()
export class TrendingDecayJob {
  constructor(private readonly rankStore: TrendingRankStore) {}

  @Cron(TRENDING_DECAY_INTERVAL, { waitForCompletion: true })
  async decayTrendingScores() {
    let cursor = '0';

    do {
      const [nextCursor, items] = await this.rankStore.scan(
        cursor,
        TRENDING_DECAY_SCAN_BATCH_SIZE,
      );
      cursor = nextCursor;

      if (!items.length) continue;

      const pipeline = this.rankStore.pipeline();

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
}
