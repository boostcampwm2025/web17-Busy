import { Module } from '@nestjs/common';
import { RedisHealthService } from './redis-health.service';

@Module({
  providers: [RedisHealthService],
  exports: [RedisHealthService],
})
export class FeedModule {}
