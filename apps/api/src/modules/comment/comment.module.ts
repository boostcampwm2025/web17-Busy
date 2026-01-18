import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { Comment } from './entities/comment.entity';
import { PostModule } from '../post/post.module';

@Module({
  imports: [PostModule, TypeOrmModule.forFeature([Comment])],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
  exports: [],
})
export class CommentModule {}
