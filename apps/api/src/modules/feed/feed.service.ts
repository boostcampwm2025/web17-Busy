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

    // todo promise.all로 묶기
    // 팔로잉 글 (+ 내 글)
    // 인기 게시글

    const [
      { posts: followingPosts, nextCursor: nextFollowingCursor },
      { posts: trendingPosts, nextCursor: nextTrendingCursor },
    ] = await Promise.all([
      await this.followingSource.getPosts(
        isInitialRequest,
        requestUserId,
        followingLimit,
        cursor?.following,
      ),
      await this.trendingSource.getPosts(
        isInitialRequest,
        requestUserId,
        trendingLimit,
        cursor?.trending,
      ),
    ]);

    // 덜 조회된 팔로잉 글 수만큼 최신글을 더 조회
    const followingShortage = followingLimit - followingPosts.length;
    recentLimit += followingShortage;

    // 최신글
    const { posts: recentPosts, nextCursor: nextRecentCursor } =
      await this.recentSource.getPosts(
        isInitialRequest,
        requestUserId,
        recentLimit,
        cursor?.recent,
      );

    // 합치기
    const posts = this.feedCompositionPolicy.compose(
      followingPosts,
      trendingPosts,
      recentPosts,
    );

    return {
      hasNext:
        !!nextFollowingCursor || !!nextTrendingCursor || !!nextRecentCursor,
      nextCursor: {
        following: nextFollowingCursor,
        trending: nextTrendingCursor,
        recent: nextRecentCursor,
      },
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
