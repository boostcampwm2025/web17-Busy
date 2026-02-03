import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { TrendingModule } from '../trending/trending.module';
import { FollowingSource } from './sources/following.source';
import { TrendingSource } from './sources/trending.source';
import { RecentSource } from './sources/recent.source';
import { FeedCompositionPolicy } from './policy/feed-composition.policy';
import { SourceAllocationPolicy } from './policy/source-allocation.policy';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), TrendingModule],
  controllers: [FeedController],
  providers: [
    FeedService,
    FollowingSource,
    TrendingSource,
    RecentSource,
    FeedCompositionPolicy,
    SourceAllocationPolicy,
  ],
})
export class FeedModule {}
