import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostResponse, MusicResponseDto, FeedResponseDto } from '@repo/dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async getFeedPosts(
    requestUserId: string | null,
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

  private createFeedQueryBuilder(
    requestUserId: string | null,
    cursor?: string,
  ): SelectQueryBuilder<Post> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .orderBy('post.id', 'DESC');

    // 로그인 상태인 경우 조건 추가
    if (requestUserId) {
      // isLiked 확인용 조인
      query.leftJoinAndSelect(
        'post.likes',
        'like',
        'like.userId = :requestUserId',
        { requestUserId },
      );

      // TODO: 팔로우한 사용자 게시물 필터링 조건 추가
    }

    // 커서 페이지네이션 조건 추가
    if (cursor) {
      query.andWhere('post.id < :cursor', { cursor });
    }

    return query;
  }

  private mapToFeedResponseDto(posts: Post[]): PostResponse[] {
    return posts.map((post: Post): PostResponse => {
      const isLiked = !!(post.likes && post.likes.length > 0); // isLiked 판별 -> 조인 결과 있으면 true, 없으면 false
      const isEdited =
        post.updatedAt.getTime() - post.createdAt.getTime() >= 1000;

      return {
        postId: post.id,
        content: post.content,
        coverImgUrl: post.coverImgUrl,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt.toISOString(),
        isEdited,
        isLiked,
        author: {
          userId: post.author.id,
          nickname: post.author.nickname,
          profileImgUrl:
            post.author.profileImgUrl || 'https://placehold.co/400',
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
