import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { LikeRepository } from './like.repository';
import { PostModule } from '../post/post.module';
import { NotiModule } from '../noti/noti.module';
import { TrendingModule } from '../trending/trending.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Like]),
    PostModule,
    NotiModule,
    TrendingModule,
  ],
  controllers: [LikeController],
  providers: [LikeService, LikeRepository],
  exports: [LikeService, LikeRepository],
})
export class LikeModule {}
