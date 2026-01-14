import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Post,
  PostService,
  PostController,
  PostMusic,
  PostMusicRepository,
  FeedService,
} from './index';
import { LikeModule } from '@/modules';

@Module({
  imports: [LikeModule, TypeOrmModule.forFeature([Post, PostMusic])],
  controllers: [PostController],
  providers: [PostService, FeedService, PostMusicRepository],
})
export class PostModule {}
