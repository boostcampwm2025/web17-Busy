import { Injectable } from '@nestjs/common';
import { FeedResponseDto } from '@repo/dto/post/res/feedResponseDto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostResponse, MusicResponse } from '@repo/dto/post/res/shared';

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
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postMusics', 'postMusic')
      .leftJoinAndSelect('postMusic.music', 'music')
      .where('1=1'); // 조건 체이닝 유지

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

    // 데이터 조회
    const posts = await query
      .orderBy('post.id', 'DESC')
      .take(limit + 1)
      .getMany();

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
        createdAt: post.createdAt,
        isEdited,
        isLiked,
        author: {
          userId: post.author.id,
          nickname: post.author.nickname,
          profileImgUrl: post.author.profileImgUrl ?? '',
        },
        musics: post.postMusics.map(
          ({ music }): MusicResponse => ({
            musicId: music.id,
            title: music.title,
            artistName: music.artistName,
            albumCoverUrl: music.albumCoverUrl,
            trackUri: music.trackUri,
            durationMs: music.durationMs,
          }),
        ),
      };
    });
  }
}
