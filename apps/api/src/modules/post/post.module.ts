import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { PostMusic } from './entities/post-music.entity';
import { PostMusicRepository } from './post-music.repository';
import { LikeModule } from '../like/like.module';
import { Post } from './entities/post.entity';

@Module({
  imports: [LikeModule, TypeOrmModule.forFeature([Post, PostMusic])],
  controllers: [PostController],
  providers: [PostService, FeedService, PostMusicRepository],
})
export class PostModule {}
