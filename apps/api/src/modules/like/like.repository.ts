import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Like } from './entities/like.entity';

@Injectable()
export class LikeRepository {
  constructor(
    @InjectRepository(Like)
    private readonly repository: Repository<Like>,
  ) {}

  async createLike(
    manager: EntityManager,
    userId: string,
    postId: string,
  ): Promise<void> {
    await manager.insert(Like, { userId, postId });
  }

  async deleteLike(
    manager: EntityManager,
    userId: string,
    postId: string,
  ): Promise<boolean> {
    const result = await manager.delete(Like, { userId, postId });
    return result.affected ? result.affected > 0 : false;
  }

  async findLikedUsersByPostId(postId: string): Promise<Like[]> {
    return this.repository.find({
      where: { postId },
      relations: ['user'],
      select: {
        userId: true,
        createdAt: true,
        user: {
          id: true,
          profileImgUrl: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async checkIsLiked(userId: string, postId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { userId, postId } });
    return count > 0;
  }


  async isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
    return await this.repository.exists({
      where: { postId, userId },
    });
  
}
