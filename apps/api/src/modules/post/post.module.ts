import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { FeedService } from './feed.service';
import { PostMusic } from './entities/post-music.entity';
import { PostMusicRepository } from './post-music.repository';
import { LikeModule } from '../like/like.module';

@Module({
  imports: [LikeModule, TypeOrmModule.forFeature([Post, PostMusic])],
  controllers: [PostController],
  exports: [PostRepository],
  providers: [PostService, PostRepository, FeedService, PostMusicRepository],
})
export class PostModule {}
