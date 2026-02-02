import { Injectable } from '@nestjs/common';
import { Post } from '../post/entities/post.entity';
import { PostResponseDto, MusicResponseDto, FeedResponseDto } from '@repo/dto';
import { FollowingSource } from './sources/following.source';
import { TrendingSource } from './sources/trending.source';
import { RecentSource } from './sources/recent.source';
import { SourceAllocationPolicy } from './policy/source-allocation.policy';

@Injectable()
export class FeedService {
  constructor(
    private readonly sourceAllocationPolicy: SourceAllocationPolicy,

    private readonly followingSource: FollowingSource,
    private readonly trendingSource: TrendingSource,
    private readonly recentSource: RecentSource,
  ) {}

  async feed(
    requestUserId: string | null,
    limit: number,
    cursor?: string,
    recentCursor?: string,
  ): Promise<FeedResponseDto> {
    const { followingLimit, trendingLimit, recentLimit } =
      this.sourceAllocationPolicy.allocate(limit);

    // 팔로잉 글 (+ 내 글)
    const followingPosts = await this.followingSource.getFollowingPosts(
      requestUserId,
      followingLimit,
      cursor,
    );

    // console.log('팔로잉 사용자 게시글', followingPosts.map(p => ([p.id, p.author.nickname, p.content])));

    // 인기 게시글
    const trendingPosts = await this.trendingSource.getTrendingPosts(
      requestUserId,
      trendingLimit,
      cursor,
    );

    // console.log('인기 게시글', trendingPosts.map(p => ([p.id, p.author.nickname, p.content])));

    // 덜 조회된 팔로잉 글 수만큼 최신글을 더 조회
    const followingShortage = followingLimit - followingPosts.length;

    // 최근 게시글 용 커서 추가하고 얘는 cursor보다 최신글을 조회
    const recentPosts =
      cursor && !recentCursor
        ? []
        : await this.recentSource.getRecentPosts(
            requestUserId,
            recentLimit + followingShortage,
            recentCursor,
          );

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

  private dedupePosts(followingPosts: Post[], trendingPosts: Post[]) {
    const map = new Map<string, Post>();

    followingPosts.forEach((p) => map.set(p.id, p));

    trendingPosts.forEach((p) => {
      if (map.has(p.id)) return;
      map.set(p.id, p);
    });

    return Array.from(map.values());
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
