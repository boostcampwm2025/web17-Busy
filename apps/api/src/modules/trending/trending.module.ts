import { Module } from '@nestjs/common';
import { RedisHealthService } from './redis-health.service';
import { TrendingController } from './trending.controller';
import { TrendingService } from './trending.service';

@Module({
  providers: [RedisHealthService, TrendingService],
  controllers: [TrendingController],
  exports: [TrendingService],
})
export class TrendingModule {}
