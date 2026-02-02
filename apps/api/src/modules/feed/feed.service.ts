import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { PostResponseDto, MusicResponseDto, FeedResponseDto } from '@repo/dto';
import { TrendingService } from '../trending/trending.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { REDIS_KEYS } from 'src/infra/redis/redis-keys';
import { FollowingSourceService } from './sources/following-source.service';
import { TrendingSourceService } from './sources/trending-source.service';
import { RecentSourceService } from './sources/recent-source.service';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly trendingService: TrendingService,

    private readonly followingSource: FollowingSourceService,
    private readonly trendingSource: TrendingSourceService,
    private readonly recentSource: RecentSourceService,
  ) {}

  async feed(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
    recentCursor?: string,
  ): Promise<FeedResponseDto> {
    // 팔로잉 글 (+ 내 글)
    const followingPosts = await this.followingSource.getFollowingPosts(
      requestUserId,
      limit,
      cursor,
    );

    // console.log('팔로잉 사용자 게시글', followingPosts.map(p => ([p.id, p.author.nickname, p.content])));

    // 인기 게시글
    const trendingPosts = await this.trendingSource.getTrendingPosts(
      requestUserId,
      limit,
      cursor,
    );

    // console.log('인기 게시글', trendingPosts.map(p => ([p.id, p.author.nickname, p.content])));

    // 최근 게시글 용 커서 추가하고 얘는 cursor보다 최신글을 조회
    const recentPosts =
      cursor && !recentCursor
        ? []
        : await this.getRecentPosts(requestUserId, limit, recentCursor);

    const hasRecentNext = recentPosts.length > limit;
    const targetRecentPosts = hasRecentNext
      ? recentPosts.slice(0, limit)
      : recentPosts;
    const nextRecentCursor = hasRecentNext
      ? targetRecentPosts[0].id
      : undefined;

    // 중복 제거
    const tmpPosts = this.dedupePosts(followingPosts, trendingPosts);

    // 정렬
    tmpPosts.sort((a, b) => b.id.localeCompare(a.id));

    // hasNext, nextCursor 설정
    const hasNext = tmpPosts.length > limit;
    const targetPosts = hasNext ? tmpPosts.slice(0, limit) : tmpPosts;
    const nextCursor =
      targetPosts.length > 0
        ? targetPosts[targetPosts.length - 1].id
        : undefined;

    const map = new Map<string, Post>();

    let notDuplicatedRecentPosts: Post[] = [];

    targetPosts.forEach((p) => map.set(p.id, p));

    targetRecentPosts.forEach((p) => {
      if (map.has(p.id)) return;
      notDuplicatedRecentPosts.push(p);
    });
    notDuplicatedRecentPosts = notDuplicatedRecentPosts.slice(0, limit);

    const len = limit;
    const firstIdx = Math.floor(len / 3);
    const secondIdx = firstIdx + firstIdx;

    const first = notDuplicatedRecentPosts.slice(0, firstIdx);
    const second = notDuplicatedRecentPosts.slice(firstIdx, secondIdx);
    const third = notDuplicatedRecentPosts.slice(secondIdx, len);

    const f = targetPosts.slice(0, firstIdx);
    const s = targetPosts.slice(firstIdx, secondIdx);
    const t = targetPosts.slice(secondIdx, len);

    // 응답 데이터 생성
    return {
      hasNext: hasNext || hasRecentNext,
      nextCursor,
      nextRecentCursor,
      posts: this.mapToFeedResponseDto([
        ...f,
        ...first,
        ...s,
        ...second,
        ...t,
        ...third,
      ]),
    };
  }

  private async getRecentPosts(
    userId: string | null,
    limit: number,
    cursor?: string,
  ) {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC');

    if (userId) {
      query.leftJoinAndSelect('post.likes', 'like', 'like.userId = :userId', {
        userId,
      });
    }

    if (cursor) {
      query.andWhere('post.id > :cursor', { cursor });
    }

    return await query.take(limit + 1).getMany();
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

  private dedupePosts(followingPosts: Post[], trendingPosts: Post[]) {
    const map = new Map<string, Post>();

    followingPosts.forEach((p) => map.set(p.id, p));

    trendingPosts.forEach((p) => {
      if (map.has(p.id)) return;
      map.set(p.id, p);
    });

    return Array.from(map.values());
  }

  private async getPostsOfFollowings(
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
    postIds = postIds.slice(0, limit);

    // 게시글 조회
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
      query.andWhere('post.id IN (:...postIds)', { postIds });
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
