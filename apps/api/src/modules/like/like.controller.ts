import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { LikeService } from './like.service';
import { CreateLikeDto, LikedUserDto } from '@repo/dto';
import { LikeStreamLogInterceptor } from 'src/common/interceptors/like-stream-log.interceptor';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(LikeStreamLogInterceptor)
  async addLike(
    @UserId() userId: string,
    @Body() createLikeDto: CreateLikeDto,
  ) {
    return await this.likeService.addLike(userId, createLikeDto);
  }

  @Delete(':postId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(LikeStreamLogInterceptor)
  async removeLike(
    @UserId() userId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return await this.likeService.removeLike(userId, postId);
  }

  @Get(':postId/users')
  async getLikedUsers(
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<LikedUserDto[]> {
    return this.likeService.getLikedUsers(postId);
  }
}
