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
} from '@repo/dto/post/req/index';
import {
  FeedResponseDto,
  GetPostDetailResponseDto,
} from '@repo/dto/post/res/index';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { FeedService } from './feed.service';

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

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) postId: string,
    @Body() updatePostDto: UpdatePostRequestDto,
  ): Promise<{ ok: true }> {
    try {
      this.postService.update(postId, updatePostDto.content);
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) postId: string,
  ): Promise<{ ok: true }> {
    try {
      await this.postService.delete(postId);
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }
}
