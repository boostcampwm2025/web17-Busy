import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RecentSourceService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  async getRecentPosts(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC');

    if (requestUserId) {
      query.leftJoinAndSelect(
        'post.likes',
        'like',
        'like.userId = :requestUserId',
        {
          requestUserId,
        },
      );
    }

    if (cursor) {
      query.andWhere('post.id > :cursor', { cursor });
    }

    return await query.take(limit + 1).getMany();
  }
}
