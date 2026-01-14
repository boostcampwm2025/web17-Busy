import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { Like } from './entities/like.entity';

@Injectable()
export class LikeRepository extends Repository<Like> {
  constructor(private readonly ds: DataSource) {
    super(Like, ds.createEntityManager());
  }

  async isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
    return await this.exists({
      where: { postId, userId },
    });
  }
}
