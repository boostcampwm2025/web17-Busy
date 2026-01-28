import { Module } from '@nestjs/common';
import { RedisHealthService } from './redis-health.service';
import { TrendingService } from './trending.service';

@Module({
  providers: [RedisHealthService, TrendingService],
  exports: [TrendingService],
})
export class TrendingModule {}
