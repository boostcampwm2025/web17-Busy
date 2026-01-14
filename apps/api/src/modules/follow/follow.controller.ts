import { Controller } from '@nestjs/common';
import { FollowService } from './index';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}
}
