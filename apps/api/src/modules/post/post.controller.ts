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
import { PostService, FeedService } from './index';
import {
  CreatePostRequestDto,
  UpdatePostRequestDto,
  FeedResponseDto,
  GetPostDetailResponseDto,
} from '@repo/dto';
import { AuthGuard, UserId } from '@/common';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly feedservice: FeedService,
  ) {}

  // feed 모둘이나 서비스 분리
  @Get('feed')
  async feed(
    @UserId() requestUserId: string | null,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('cursor', new ParseUUIDPipe({ version: '7' })) cursor?: string,
  ): Promise<FeedResponseDto> {
    try {
      return await this.feedservice.feed(requestUserId, limit, cursor);
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @UserId() requestUserId: string,
    @Body() createPostDto: CreatePostRequestDto,
  ): Promise<{ ok: true }> {
    try {
      const { musics, content, thumbnailImgUrl } = createPostDto;
      await this.postService.create(
        requestUserId,
        musics,
        content,
        thumbnailImgUrl,
      );
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }

  @Get(':id')
  async getPostDetail(
    @UserId() requestUserId: string,
    @Param('id') postId: string,
  ): Promise<GetPostDetailResponseDto | null> {
    try {
      return await this.postService.getPostDetail(postId, requestUserId);
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @UserId() requestUserId: string,
    @Param('id', ParseIntPipe) postId: string,
    @Body() updatePostDto: UpdatePostRequestDto,
  ): Promise<{ ok: true }> {
    try {
      this.postService.update(requestUserId, postId, updatePostDto.content);
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(
    @UserId() requestUserId: string,
    @Param('id', ParseIntPipe) postId: string,
  ): Promise<{ ok: true }> {
    try {
      await this.postService.delete(requestUserId, postId);
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }
}
