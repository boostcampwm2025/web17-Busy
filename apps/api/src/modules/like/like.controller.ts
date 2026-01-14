import { Controller } from '@nestjs/common';
import { LikeService } from './index';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}
}
