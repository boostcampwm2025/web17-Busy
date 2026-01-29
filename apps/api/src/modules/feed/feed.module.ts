import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { TrendingModule } from '../trending/trending.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), TrendingModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
