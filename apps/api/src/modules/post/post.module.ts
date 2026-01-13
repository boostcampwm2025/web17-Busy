import { Module, Post } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { Like } from '../like/entities/like.entity';
import { PostMusic } from './entities/post-music.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostMusic, Like])],
  controllers: [PostController],
  providers: [PostService, FeedService],
})
export class PostModule {}
