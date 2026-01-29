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
  UseGuards,
  UseInterceptors,
  UploadedFile,
  DefaultValuePipe,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  PostResponseDto,
  CreatePostMultipartDto,
  MusicRequestDto,
  UpdatePostRequestDto,
  FindByUserDto,
} from '@repo/dto';

import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { AuthOptionalGuard } from 'src/common/guards/auth.optional-guard';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly uploadService: UploadService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('coverImgUrl'))
  async createPostIncludeImg(
    @UserId() requestUserId: string,
    @UploadedFile() coverImgFile: Express.Multer.File,
    @Body() body: CreatePostMultipartDto,
  ): Promise<{ ok: true }> {
    const { content } = body;

    let musics: MusicRequestDto[];
    try {
      musics = JSON.parse(body.musics ?? '[]');
    } catch {
      throw new BadRequestException('musics 형식이 올바르지 않습니다.');
    }

    let thumbnailImgUrl: string | undefined;

    if (coverImgFile) {
      thumbnailImgUrl = await this.uploadService.uploadPostImage(coverImgFile);
    }

    await this.postService.create(
      requestUserId,
      musics,
      content,
      thumbnailImgUrl,
    );

    return { ok: true };
  }

  @UseGuards(AuthOptionalGuard)
  @Get(':id')
  async getPostDetail(
    @UserId() requestUserId: string | null,
    @Param('id') postId: string,
  ): Promise<PostResponseDto | null> {
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

  @Get('/user/:userId')
  async getByUserId(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ): Promise<FindByUserDto> {
    try {
      return await this.postService.getByUserId(userId, limit, cursor);
    } catch (error) {
      throw new InternalServerErrorException(
        `데이터를 불러오는 데 실패했습니다. 에러 메시지: ${error.message}`,
      );
    }
  }
}
