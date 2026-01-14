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
  DefaultValuePipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostRequestDto } from '@repo/dto/post/req/createPostRequestDto';
import { UpdatePostRequestDto } from '@repo/dto/post/req/updatePostRequestDto';
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

  @Get('feed')
  async feed(
    @UserId() requestUserId: string | null,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new ParseUUIDPipe({ version: '7', optional: true }))
    cursor?: string,
  ): Promise<FeedResponseDto> {
    try {
      return await this.feedservice.getFeedPosts(requestUserId, limit, cursor);
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
