import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { CreateFollowDto } from '@repo/dto';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createFollow(
    @UserId() userId: string,
    @Body() createFollowDto: CreateFollowDto,
  ) {
    return await this.followService.addFollow(userId, createFollowDto);
  }
}
