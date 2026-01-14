import { Module } from '@nestjs/common';
import { FollowController, FollowService } from './index';

@Module({
  imports: [],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
