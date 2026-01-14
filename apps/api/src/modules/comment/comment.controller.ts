import { Controller } from '@nestjs/common';
import { CommentService } from './index';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}
}
