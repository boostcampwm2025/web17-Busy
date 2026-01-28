import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommentRepository } from './comment.repository';
import { PostRepository } from '../post/post.repository';
import { Comment } from './entities/comment.entity';

import { CreateCommentDto, GetCommentsResDto, NotiType } from '@repo/dto';
import { NotiService } from '../noti/noti.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postRepository: PostRepository,
    private readonly dataSource: DataSource,
    private readonly notiService: NotiService,
  ) {}

  // 댓글 생성
  async createComment(
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { postId, content } = createCommentDto;

    const txResult = await this.dataSource.transaction(async (manager) => {
      // 게시글 존재 확인
      const post = await this.postRepository.findPostById(postId, manager);
      if (!post) {
        throw new NotFoundException('게시글을 찾을 수 없습니다.');
      }

      // 2. 댓글 생성
      const comment = await this.commentRepository.createComment(
        userId,
        postId,
        content,
        manager,
      );

      await this.postRepository.incrementCommentCount(postId, manager);

      return comment;
    });

    // 알림 생성은 await 안 함
    void this.notiService
      .create({
        type: NotiType.COMMENT,
        actorId: userId,
        relatedId: postId,
      })
      .catch(() => {});

    return txResult;
  }

  // 댓글 목록 조회 (DTO 매핑 수행)
  async getComments(postId: string): Promise<GetCommentsResDto> {
    const comments = await this.commentRepository.findCommentsByPostId(postId);

    return {
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: comment.author?.id,
          nickname: comment.author?.nickname,
          profileImgUrl: comment.author?.profileImgUrl,
        },
      })),
    };
  }

  // 댓글 수정
  async updateComment(
    userId: string,
    commentId: string,
    content: string,
  ): Promise<void> {
    const comment = await this.commentRepository.findCommentById(commentId);

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('댓글 수정 권한이 없습니다.');
    }

    await this.commentRepository.updateComment(commentId, content);
  }

  // 댓글 삭제 (트랜잭션: Soft Delete + 게시글 댓글 수 감소)
  async deleteComment(userId: string, commentId: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const comment = await this.commentRepository.findCommentById(
        commentId,
        manager,
      );

      if (!comment) {
        throw new NotFoundException('댓글을 찾을 수 없습니다.');
      }

      if (comment.author.id !== userId) {
        throw new ForbiddenException('댓글 삭제 권한이 없습니다.');
      }

      // 2. Soft Delete 수행
      await this.commentRepository.softDeleteComment(commentId, manager);
      // 3. 게시글 댓글 카운트 감소
      await this.postRepository.decrementCommentCount(comment.post.id, manager);
    });
  }
}
