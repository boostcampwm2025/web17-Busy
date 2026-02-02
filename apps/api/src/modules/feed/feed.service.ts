import { Injectable } from '@nestjs/common';
import { Post } from '../post/entities/post.entity';
import {
  PostResponseDto,
  MusicResponseDto,
  FeedResponseDto,
  Cursor,
} from '@repo/dto';
import { FollowingSource } from './sources/following.source';
import { TrendingSource } from './sources/trending.source';
import { RecentSource } from './sources/recent.source';
import { SourceAllocationPolicy } from './policy/source-allocation.policy';
import { FeedCompositionPolicy } from './policy/feed-composition.policy';

@Injectable()
export class FeedService {
  constructor(
    private readonly followingSource: FollowingSource,
    private readonly trendingSource: TrendingSource,
    private readonly recentSource: RecentSource,

    private readonly sourceAllocationPolicy: SourceAllocationPolicy,
    private readonly feedCompositionPolicy: FeedCompositionPolicy,
  ) {}

  async feed(
    requestUserId: string | null,
    limit: number,
    cursor?: Cursor,
  ): Promise<FeedResponseDto> {
    const isInitialRequest = this.isInitialCursor(cursor);

    let { followingLimit, trendingLimit, recentLimit } =
      this.sourceAllocationPolicy.allocate(limit);

    // 팔로잉 글 (+ 내 글)
    let followingPosts: Post[] = [];

    if (isInitialRequest || cursor?.following) {
      followingPosts = await this.followingSource.getFollowingPosts(
        requestUserId,
        followingLimit,
        cursor?.following,
      );
    }
    const nextFollowingCursor =
      followingPosts.length >= followingLimit
        ? followingPosts[followingPosts.length - 1].id
        : undefined;
    // console.log('팔로잉 사용자 게시글', followingPosts.map(p => ([p.id, p.author.nickname, p.content])));

    // 인기 게시글
    let trendingPosts: Post[] = [];
    let nextTrendingCursor: number | undefined = undefined;
    if (isInitialRequest || cursor?.trending) {
      const { posts, nextCursor } = await this.trendingSource.getTrendingPosts(
        requestUserId,
        trendingLimit,
        cursor?.trending,
      );

      trendingPosts = posts;
      nextTrendingCursor = nextCursor;
    }

    // console.log('인기 게시글', trendingPosts.map(p => ([p.id, p.author.nickname, p.content])));

    let recentPosts: Post[] = [];

    if (isInitialRequest || cursor?.recent) {
      // 덜 조회된 팔로잉 글 수만큼 최신글을 더 조회
      const followingShortage = followingLimit - followingPosts.length;
      recentLimit += followingShortage;

      recentPosts = await this.recentSource.getRecentPosts(
        requestUserId,
        recentLimit,
        cursor?.recent,
      );
    }
    const nextRecentCursor =
      recentPosts.length >= recentLimit
        ? recentPosts[recentPosts.length - 1].id
        : undefined;

    // 합치기
    const posts = this.feedCompositionPolicy.compose(
      followingPosts,
      trendingPosts,
      recentPosts,
    );

    const hasNext =
      !!nextFollowingCursor || !!nextTrendingCursor || !!nextRecentCursor;
    const nextCursor: Cursor = {
      following: nextFollowingCursor,
      trending: nextTrendingCursor,
      recent: nextRecentCursor,
    };

    return {
      hasNext,
      nextCursor,
      posts: this.mapToFeedResponseDto(posts),
    };
  }

  private isInitialCursor(cursor?: Cursor) {
    return (
      !cursor ||
      (cursor.following === undefined &&
        cursor.trending === undefined &&
        cursor.recent === undefined)
    );
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
