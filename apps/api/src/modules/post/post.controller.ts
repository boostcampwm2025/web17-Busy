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
  UseInterceptors,
  UploadedFile,
  DefaultValuePipe,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  FeedResponseDto,
  GetPostDetailResponseDto,
  CreatePostMultipartDto,
  MusicRequestDto,
  UpdatePostRequestDto,
} from '@repo/dto';

import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { FeedService } from './feed.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly feedService: FeedService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('feed')
  async feed(
    @UserId() requestUserId: string | null,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new ParseUUIDPipe({ version: '7', optional: true }))
    cursor?: string,
  ): Promise<FeedResponseDto> {
    try {
      return await this.feedService.getFeedPosts(requestUserId, limit, cursor);
    } catch (error) {
      throw new InternalServerErrorException(
        `피드 데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('coverImgUrl'))
  async createPostIncludeImg(
    @UserId() requestUserId: string,
    @UploadedFile() coverImgUrl: Express.Multer.File,
    @Body() body: CreatePostMultipartDto,
  ): Promise<{ ok: true }> {
    const { content } = body;

    let musics: MusicRequestDto[];
    try {
      musics = JSON.parse(body.musics ?? '[]');
    } catch {
      throw new BadRequestException('musics 형식이 올바르지 않습니다.');
    }

    const thumbnailImgUrl = coverImgUrl
      ? this.uploadService.toPublicUrl(coverImgUrl.filename)
      : undefined;

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
