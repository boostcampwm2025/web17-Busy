import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Post } from './entities/post.entity';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  // 좋아요 수 증가
  async incrementLikeCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;

    await repo.increment({ id: postId }, 'likeCount', 1);
  }

  // 좋아요 수 감소
  async decrementLikeCount(
    postId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Post) : this.repository;

    await repo.decrement({ id: postId }, 'likeCount', 1);
  }
}
