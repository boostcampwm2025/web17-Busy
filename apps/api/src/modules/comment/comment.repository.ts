import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly repository: Repository<Comment>,
  ) {}

  // 댓글 생성 (트랜잭션 지원)
  async createComment(
    userId: string,
    postId: string,
    content: string,
    manager?: EntityManager,
  ): Promise<Comment> {
    const repo = manager ? manager.getRepository(Comment) : this.repository;

    const comment = repo.create({
      content,
      author: { id: userId },
      post: { id: postId },
    });

    return repo.save(comment);
  }

  // 게시글 ID로 댓글 목록 조회
  async findCommentsByPostId(
    postId: string,
    manager?: EntityManager,
  ): Promise<Comment[]> {
    const repo = manager ? manager.getRepository(Comment) : this.repository;

    return repo.find({
      where: { post: { id: postId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  // 댓글 ID로 조회 (작성자, 게시글 정보 포함)
  async findCommentById(
    commentId: string,
    manager?: EntityManager,
  ): Promise<Comment | null> {
    const repo = manager ? manager.getRepository(Comment) : this.repository;

    return repo.findOne({
      where: { id: commentId },
      relations: ['author', 'post'],
    });
  }

  // 댓글 업데이트
  async updateComment(
    commentId: string,
    content: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Comment) : this.repository;

    await repo.update(commentId, { content });
  }

  // 댓글 삭제 (Soft Delete)
  async softDeleteComment(
    commentId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Comment) : this.repository;

    await repo.softDelete(commentId);
  }
}
