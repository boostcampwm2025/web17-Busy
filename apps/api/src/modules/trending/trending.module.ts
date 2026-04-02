import { Module } from '@nestjs/common';
import { TrendingService } from './trending.service';
import { TrendingRankStore } from './rank/trending-rank.store';
import { TrendingStreamConsumer } from './stream/trending-steam.consumer';
import { TrendingDecayJob } from './jobs/trending-decay.job';

@Module({
  providers: [
    TrendingService,
    TrendingRankStore,
    TrendingStreamConsumer,
    TrendingDecayJob,
  ],
  exports: [TrendingService],
})
export class TrendingModule {}
