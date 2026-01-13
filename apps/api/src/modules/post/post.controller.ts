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

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // feed 모둘이나 서비스 분리
  @Get('feed')
  feed(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('cursor', new ParseUUIDPipe({ version: '7' })) cursor: string,
  ): FeedResponseDto {
    return {};
  }

  @Post()
  create(@Body() createPostDto: CreatePostRequestDto) {
    return { ok: true };
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): GetPostDetailResponseDto {
    return {};
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostRequestDto,
  ) {
    return { ok: true };
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return { ok: true };
  }
}
