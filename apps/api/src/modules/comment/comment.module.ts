import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { Comment } from './entities/comment.entity';
// import { PostModule } from '../post/post.module'; TODO: 모듈로 변경 후 post Repository 사용
import { Post } from '../post/entities/post.entity';

@Module({
  imports: [
    // PostModule,
    TypeOrmModule.forFeature([Comment, Post]),
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
  exports: [],
})
export class CommentModule {}
