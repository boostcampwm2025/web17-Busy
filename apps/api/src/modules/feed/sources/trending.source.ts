import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { Post } from 'src/modules/post/entities/post.entity';
import { TrendingService } from 'src/modules/trending/trending.service';
import { Repository } from 'typeorm';
import { FeedSource } from './feed-source.interface';

@Injectable()
export class TrendingSource implements FeedSource {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    @InjectRedis() private readonly redis: Redis,
    private readonly trendingService: TrendingService,
  ) {}

  async getPosts(
    isInitialRequest: boolean,
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<{ posts: Post[]; nextCursor?: string }> {
    if (!isInitialRequest && !cursor) return { posts: [] };

    // 로그인 안 하거나 사용자 그룹이 확인되지 않았는데 조회된 글 개수가 limit 보다 크면 인기 점수순 자르기
    const parsed = cursor ? Number(cursor) : undefined;
    const maxScoreExclusive = Number.isFinite(parsed) ? parsed : undefined;
    const members = await this.getTrendingPostIds(
      requestUserId,
      limit,
      maxScoreExclusive,
    );

    if (!members || members.length === 0) return { posts: [] };

    // 게시글 조회
    const postIds = members.map((m) => m.postId);
    const posts = await this.hydratePosts(requestUserId, postIds, limit);

    // nextCursor
    const nextCursor =
      members.length >= limit ? members[members.length - 1].score : undefined;

    return { posts, nextCursor: nextCursor?.toString() };
  }

  private async getTrendingPostIds(
    requestUserId: string | null,
    limit: number,
    maxScoreExclusive?: number,
  ): Promise<{ postId: string; score: number }[]> {
    // 전체 인기글 조회
    let members =
      await this.trendingService.getByMaxScoreExclusive(maxScoreExclusive);

    const userGroupId = requestUserId
      ? await this.redis.get(REDIS_KEYS.USER_GROUP(requestUserId))
      : null;

    // 로그인 && 로그인한 사용자의 그룹이 확인되고 && 조회된 글 개수가 limit 보다 크면 group으로 필터링
    if (userGroupId && members.length > limit) {
      const pipeline = this.redis.pipeline();
      for (const member of members) {
        pipeline.get(REDIS_KEYS.POST_GROUP(member.postId));
      }

      const results = await pipeline.exec();

      if (!results)
        throw new InternalServerErrorException(
          '피드 - 게시글들의 그룹 확인이 되지 않습니다.',
        );

      const membersWithGroupId = members.map((member, idx) => {
        const [, groupId] = results[idx] as [any, string | null];
        return { ...member, groupId };
      });

      // filtering 해야되는 개수
      let restCutoffCount = members.length - limit;

      // 뒤에꺼부터 잘라야 점수 낮은것부터 잘림
      const result: { postId: string; score: number }[] = [];
      for (let i = membersWithGroupId.length - 1; i >= 0; --i) {
        const mg = membersWithGroupId[i];

        if (restCutoffCount > 0 && mg.groupId !== userGroupId) {
          --restCutoffCount;
          continue;
        }

        result.push({ postId: mg.postId, score: mg.score });
      }
      result.reverse();

      members = result;
    }

    // 로그인 안 하거나 사용자 그룹이 확인되지 않았는데 조회된 글 개수가 limit 보다 크면 인기 점수순 자르기
    return members.slice(0, limit);
  }

  private async hydratePosts(
    requestUserId: string | null,
    postIds: string[],
    limit: number,
  ): Promise<Post[]> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music');

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

    return await query.take(limit + 1).getMany();
  }
}
