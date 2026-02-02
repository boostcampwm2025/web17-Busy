import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FollowingSourceService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
  ) {}

  async getFollowingPosts(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<Post[]> {
    const myPosts = requestUserId
      ? await this.getPostsByAuthorId(requestUserId, limit, cursor)
      : [];

    const followingPosts = await this.getPostsOfFollowings(
      requestUserId,
      limit,
      cursor,
    );

    return [...myPosts, ...followingPosts]
      .toSorted((a, b) => b.id.localeCompare(a.id))
      .slice(0, limit);
  }

  private async getPostsByAuthorId(
    authorId: string,
    limit: number,
    cursor?: string,
  ) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC')
      .where('author.id = :authorId', { authorId });

    query.leftJoinAndSelect('post.likes', 'like', 'like.userId = :authorId', {
      authorId,
    });

    if (cursor) {
      query.andWhere('post.id < :cursor', { cursor });
    }

    return await query.take(limit + 1).getMany();
  }

  private async getPostsOfFollowings(
    userId: string | null,
    limit: number,
    cursor?: string,
  ) {
    if (!userId) return [];

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC');

    //  좋아요 여부 확인
    query.leftJoinAndSelect('post.likes', 'like', 'like.userId = :userId', {
      userId,
    });

    // 팔로잉한 사용자의 게시글만 조회
    query.innerJoin(
      'follow',
      'f',
      'f.followingUserId = :userId AND f.followedUserId = author.id',
      { userId },
    );

    // 커서 페이지네이션 조건 추가
    if (cursor) {
      query.andWhere('post.id < :cursor', { cursor });
    }

    return await query.take(limit + 1).getMany();
  }
}
