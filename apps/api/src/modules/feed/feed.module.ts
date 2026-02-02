import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { TrendingModule } from '../trending/trending.module';
import { FollowingSourceService } from './sources/following-source.service';
import { TrendingSourceService } from './sources/trending-source.service';
import { RecentSourceService } from './sources/recent-source.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), TrendingModule],
  controllers: [FeedController],
  providers: [
    FeedService,
    FollowingSourceService,
    TrendingSourceService,
    RecentSourceService,
  ],
})
export class FeedModule {}
