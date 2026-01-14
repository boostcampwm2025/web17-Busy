import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  // 게시글 ID로 댓글 목록 조회 (작성자 정보 포함)
  async findCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.repository.find({
      where: { post: { id: postId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  // 댓글 ID로 조회 (작성자, 게시글 정보 포함 - 권한 체크 및 카운트 감소용)
  async findCommentById(commentId: string): Promise<Comment | null> {
    return this.repository.findOne({
      where: { id: commentId },
      relations: ['author', 'post'],
    });
  }
}
