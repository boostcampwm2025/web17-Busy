import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { PostResponseDto, MusicResponseDto, FeedResponseDto } from '@repo/dto';
import { TrendingService } from '../trending/trending.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly trendingService: TrendingService,
  ) {}

  async feed(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<FeedResponseDto> {
    // 팔로잉 사용자들의 게시글
    const followingPosts = await this.getPostsOrFollowings(
      requestUserId,
      limit,
      cursor,
    );

    // 인기 게시글
    const trendingPosts = await this.getTrendingPosts(
      requestUserId,
      limit,
      cursor,
    );

    // 중복 제거
    const posts = this.dedupePosts(followingPosts, trendingPosts);

    // 정렬
    posts.sort((a, b) => b.id.localeCompare(a.id));

    // hasNext, nextCursor 설정
    const hasNext = posts.length > limit;
    const targetPosts = hasNext ? posts.slice(0, -1) : posts;
    const nextCursor =
      targetPosts.length > 0
        ? targetPosts[targetPosts.length - 1].id
        : undefined;

    // 응답 데이터 생성
    return {
      hasNext,
      nextCursor,
      posts: this.mapToFeedResponseDto(targetPosts),
    };
  }

  private dedupePosts(posts1: Post[], posts2: Post[]) {
    const map = new Map<string, Post>();

    for (const post of posts1) {
      map.set(post.id, post);
    }

    for (const post of posts2) {
      if (map.has(post.id)) continue;
      map.set(post.id, post);
    }

    return Array.from(map.values());
  }

  async getAllPosts(
    requestUserId: string,
    limit: number,
    cursor?: string,
  ): Promise<FeedResponseDto> {
    // 데이터 조회 (hasNext 체크 위해서 limit + 1개 가져오기)
    const qb = this.createFeedQueryBuilder(requestUserId, cursor);
    const posts = await qb.take(limit + 1).getMany();

    // 응답 데이터 생성
    const hasNext = posts.length > limit;
    const targetPosts = hasNext ? posts.slice(0, -1) : posts;
    const nextCursor =
      targetPosts.length > 0
        ? targetPosts[targetPosts.length - 1].id
        : undefined;

    return {
      hasNext,
      nextCursor,
      posts: this.mapToFeedResponseDto(targetPosts),
    };
  }

  private async getPostsOrFollowings(
    userId: string | null,
    limit: number,
    cursor?: string,
  ) {
    if (!userId) return [];

    const qb = this.createFeedQueryBuilder(userId, cursor);
    return await qb.take(limit + 1).getMany();
  }

  private async getTrendingPosts(
    userId: string | null,
    limit: number,
    cursor?: string,
  ) {
    // 전체 인기글 조회
    const top = await this.trendingService.getTop(0);
    let postIds = top.map((t) => t.postId);

    const userGroupId = userId
      ? await this.redis.get(REDIS_KEYS.USER_GROUP(userId))
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

      postIds = postIdsWithGroupId
        .filter((pg) => {
          if (restCutoffCount <= 0) return true;
          if (pg.groupId === userGroupId) return true;
          --restCutoffCount;
          return false;
        })
        .map((pg) => pg.postId);
    }

    // 게시글 조회해서
    const qb = this.createFeedQueryBuilder(userId, cursor, postIds);
    return await qb.take(limit + 1).getMany();
  }

  private createFeedQueryBuilder(
    requestUserId: string | null,
    cursor?: string,
    postIds?: string[],
  ): SelectQueryBuilder<Post> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC');

    if (requestUserId) {
      // isLiked 확인용 조인
      query.leftJoinAndSelect(
        'post.likes',
        'like',
        'like.userId = :requestUserId',
        { requestUserId },
      );
    }

    const hasPostIds = Array.isArray(postIds) && postIds.length > 0;

    if (hasPostIds) {
      // postIds로만 필터 - 인기 게시글 조회 시 사용
      query.andWhere('post.id IN (...:postIds)', { postIds });
    } else if (requestUserId) {
      // 팔로잉한 사용자의 게시글만 조회
      query.innerJoin(
        'follow',
        'f',
        'f.followingUserId = :requestUserId AND f.followedUserId = author.id',
        { requestUserId },
      );
    }

    // 커서 페이지네이션 조건 추가
    if (cursor) {
      query.andWhere('post.id < :cursor', { cursor });
    }

    return query;
  }

  private mapToFeedResponseDto(posts: Post[]): PostResponseDto[] {
    return posts.map((post: Post): PostResponseDto => {
      const isLiked = !!(post.likes && post.likes.length > 0); // isLiked 판별 -> 조인 결과 있으면 true, 없으면 false
      const isEdited =
        post.updatedAt.getTime() - post.createdAt.getTime() >= 1000;

      return {
        id: post.id,
        content: post.content,
        coverImgUrl: post.coverImgUrl,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt.toISOString(),
        isEdited,
        isLiked,
        author: {
          id: post.author.id,
          nickname: post.author.nickname,
          profileImgUrl: post.author.profileImgUrl,
        },
        musics: post.postMusics.map(
          ({ music }): MusicResponseDto => ({
            id: music.id,
            title: music.title,
            artistName: music.artistName,
            albumCoverUrl: music.albumCoverUrl,
            trackUri: music.trackUri,
            provider: music.provider,
            durationMs: music.durationMs,
          }),
        ),
      };
    });
  }
}
