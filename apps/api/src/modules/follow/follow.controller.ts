import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Delete,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { CreateFollowDto, DeleteFollowDto, GetUserFollowDto } from '@repo/dto';
import { AuthOptionalGuard } from 'src/common/guards/auth.optional-guard';

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

  @Delete()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFollow(
    @UserId() userId: string,
    @Body() deleteFollowDto: DeleteFollowDto,
  ) {
    return await this.followService.removeFollow(userId, deleteFollowDto);
  }

  @Get('following/:userId')
  @UseGuards(AuthOptionalGuard)
  async getUserFollowings(
    @Param('userId') targetUserId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @UserId() userId?: string,
  ): Promise<GetUserFollowDto> {
    return await this.followService.getFollowings(
      targetUserId,
      limit,
      cursor,
      userId,
    );
  }

  @Get('follower/:userId')
  @UseGuards(AuthOptionalGuard)
  async getUserFollowers(
    @Param('userId') targetUserId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @UserId() userId?: string,
  ): Promise<GetUserFollowDto> {
    return await this.followService.getFollowers(
      targetUserId,
      limit,
      cursor,
      userId,
    );
  }
}
