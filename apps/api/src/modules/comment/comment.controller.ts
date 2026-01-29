import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';

import { CommentService } from './comment.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  GetCommentsReqDto,
  GetCommentsResDto,
} from '@repo/dto';
import { CommentStreamLogInterceptor } from 'src/common/interceptors/comment-stream-log.interceptor';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(CommentStreamLogInterceptor)
  async createComment(
    @UserId() userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const comment = await this.commentService.createComment(
      userId,
      createCommentDto,
    );

    return { message: '댓글이 생성되었습니다.', id: comment.id };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getComments(
    @Query() query: GetCommentsReqDto,
  ): Promise<GetCommentsResDto> {
    const comments = await this.commentService.getComments(query.postId);

    return comments;
  }

  @Patch(':commentId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateComment(
    @UserId() userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentDto: UpdateCommentDto, //
  ) {
    await this.commentService.updateComment(
      userId,
      commentId,
      updateCommentDto.content,
    );

    return { message: '댓글이 수정되었습니다.' };
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @UserId() userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    await this.commentService.deleteComment(userId, commentId);

    return { message: '댓글이 삭제되었습니다.' };
  }
}
