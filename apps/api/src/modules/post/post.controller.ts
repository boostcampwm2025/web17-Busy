import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  CreatePostRequestDto,
  UpdatePostRequestDto,
  FeedResponseDto,
  GetPostDetailResponseDto,
} from '@repo/dto';

import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { FeedService } from './feed.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly feedService: FeedService,
  ) {}

  // feed 모둘이나 서비스 분리
  @Get('feed')
  async feed(
    @UserId() requestUserId: string | null,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('cursor', new ParseUUIDPipe({ version: '7' })) cursor?: string,
  ): Promise<FeedResponseDto> {
    return await this.feedService.feed(requestUserId, limit, cursor);
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @UserId() requestUserId: string,
    @Body() createPostDto: CreatePostRequestDto,
  ): Promise<{ ok: true }> {
    const { musics, content, thumbnailImgUrl } = createPostDto;
    await this.postService.create(
      requestUserId,
      musics,
      content,
      thumbnailImgUrl,
    );
    return { ok: true };
  }

  @Get(':id')
  async getPostDetail(
    @UserId() requestUserId: string,
    @Param('id') postId: string,
  ): Promise<GetPostDetailResponseDto | null> {
    return await this.postService.getPostDetail(postId, requestUserId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @UserId() requestUserId: string,
    @Param('id') postId: string,
    @Body() updatePostDto: UpdatePostRequestDto,
  ): Promise<{ ok: true }> {
    this.postService.update(requestUserId, postId, updatePostDto.content);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(
    @UserId() requestUserId: string,
    @Param('id') postId: string,
  ): Promise<{ ok: true }> {
    await this.postService.delete(requestUserId, postId);
    return { ok: true };
  }
}
