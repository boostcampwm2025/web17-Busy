import { Module } from '@nestjs/common';
import { CommentController, CommentService } from './index';

@Module({
  imports: [],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
