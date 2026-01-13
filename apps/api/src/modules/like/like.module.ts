import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';

@Module({
  imports: [],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
