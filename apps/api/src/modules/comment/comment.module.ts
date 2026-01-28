import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { CommentRepository } from './comment.repository';
import { Comment } from './entities/comment.entity';
import { PostModule } from '../post/post.module';
import { NotiModule } from '../noti/noti.module';
import { LogsModule } from '../log/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    PostModule,
    NotiModule,
    LogsModule,
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentRepository],
  exports: [],
})
export class CommentModule {}
