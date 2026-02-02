import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';
import { FeedSource } from './feed-source.interface';

@Injectable()
export class RecentSource implements FeedSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  async getPosts(
    isInitialRequest: boolean,
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ) {
    if (!isInitialRequest && !cursor) return { posts: [] };

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

    const posts = await query.take(limit + 1).getMany();
    const nextCursor =
      posts.length >= limit ? posts[posts.length - 1].id : undefined;

    return { posts, nextCursor };
  }
}
