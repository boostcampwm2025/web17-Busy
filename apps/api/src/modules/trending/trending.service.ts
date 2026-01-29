import { Injectable } from '@nestjs/common';
import { TrendingRankStore } from './rank/trending-rank.store';

@Injectable()
export class TrendingService {
  private readonly consumerName = `trending-${process.pid}`;

  constructor(private readonly rankStore: TrendingRankStore) {}

  async getTop(limit = 10) {
    const end = Math.max(0, limit - 1);
    const raw = await this.rankStore.getTopWithScores(0, end);

    const result: Array<{ postId: string; score: number }> = [];
    for (let i = 0; i < raw.length; i += 2) {
      result.push({ postId: raw[i], score: Number(raw[i + 1]) });
    }
    return result;
  }
}
