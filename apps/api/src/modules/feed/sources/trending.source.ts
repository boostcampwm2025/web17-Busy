import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { Post } from 'src/modules/post/entities/post.entity';
import { TrendingService } from 'src/modules/trending/trending.service';
import { Repository } from 'typeorm';

@Injectable()
export class TrendingSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRedis() private readonly redis: Redis,
    private readonly trendingService: TrendingService,
  ) {}

  async getTrendingPosts(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<Post[]> {
    // 로그인 안 하거나 사용자 그룹이 확인되지 않았는데 조회된 글 개수가 limit 보다 크면 인기 점수순 자르기
    const postIds = await this.getTrendingPostIds(requestUserId, limit);

    if (!postIds || postIds.length === 0) return [];

    // 게시글 조회
    return await this.hydratePosts(requestUserId, postIds, limit, cursor);
  }

  private async getTrendingPostIds(
    requestUserId: string | null,
    limit: number,
  ): Promise<string[]> {
    // 전체 인기글 조회
    const top = await this.trendingService.getTop(0);
    let postIds = top.map((t) => t.postId);

    const userGroupId = requestUserId
      ? await this.redis.get(REDIS_KEYS.USER_GROUP(requestUserId))
      : null;

    // 로그인 && 로그인한 사용자의 그룹이 확인되고 && 조회된 글 개수가 limit 보다 크면 group으로 필터링
    if (userGroupId && postIds.length > limit) {
      const pipeline = this.redis.pipeline();
      for (const postId of postIds) {
        pipeline.get(REDIS_KEYS.POST_GROUP(postId));
      }

      const results = await pipeline.exec();

      if (!results)
        throw new InternalServerErrorException(
          '피드 - 게시글들의 그룹 확인이 되지 않습니다.',
        );

      const postIdsWithGroupId = postIds.map((postId, idx) => {
        const [, groupId] = results[idx] as [any, string | null];
        return { postId, groupId };
      });

      // filtering 해야되는 개수
      let restCutoffCount = postIds.length - limit;

      // 뒤에꺼부터 잘라야 점수 낮은것부터 잘림
      const result: string[] = [];
      for (let i = postIdsWithGroupId.length - 1; i >= 0; --i) {
        const pg = postIdsWithGroupId[i];

        if (restCutoffCount > 0 && pg.groupId !== userGroupId) {
          --restCutoffCount;
          continue;
        }

        result.push(pg.postId);
      }
      result.reverse();

      postIds = result;
    }

    // 로그인 안 하거나 사용자 그룹이 확인되지 않았는데 조회된 글 개수가 limit 보다 크면 인기 점수순 자르기
    return postIds.slice(0, limit);
  }

  private async hydratePosts(
    requestUserId: string | null,
    postIds: string[],
    limit: number,
    cursor?: string,
  ): Promise<Post[]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC');

    // isLiked 확인용 조인
    if (requestUserId) {
      query.leftJoinAndSelect(
        'post.likes',
        'like',
        'like.userId = :requestUserId',
        { requestUserId },
      );
    }

    query.andWhere('post.id IN (:...postIds)', { postIds });

    // 커서 페이지네이션 조건 추가
    if (cursor) {
      query.andWhere('post.id < :cursor', { cursor });
    }

    return await query.take(limit + 1).getMany();
  }
}
