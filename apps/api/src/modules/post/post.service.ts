import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PostRepository } from './post.repository';
import { Post } from './entities/post.entity';
import { PostMusic } from './entities/post-music.entity';
import { Music } from '../music/entities/music.entity';
import {
  MusicRequestDto,
  MusicResponseDto,
  MusicProvider,
  PostResponseDto,
  FindByUserDto,
  FindByUserFeedDto,
} from '@repo/dto';
import { PostMusicRepository } from './post-music.repository';
import { MusicService } from '../music/music.service';
import { Like } from '../like/entities/like.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    private readonly postRepository: PostRepository,

    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    private readonly postMusicRepo: PostMusicRepository,

    private readonly musicService: MusicService,
  ) {}

  async create(
    userId: string,
    musics: MusicRequestDto[],
    content?: string,
    thumbnailImgUrl?: string,
  ): Promise<void> {
    if (musics.length === 0)
      throw new BadRequestException(
        '게시글에는 최소 1곡의 음악이 있어야 합니다.',
      );

    musics.forEach((m) => (m.provider ??= MusicProvider.ITUNES));
    // const ensuredMusics = this.musicService.ensureMusics(musics);
    const musicIds = await Promise.all(
      musics.map(async (m) => {
        if (m.id) return m.id;
        const { id } = await this.musicService.addMusic(m);
        return id;
      }),
    );

    thumbnailImgUrl ??= musics[0].albumCoverUrl;

    await this.ds.transaction(async (transactionalEntityManager) => {
      const postRepo = transactionalEntityManager.getRepository(Post);
      const postMusicRepo = transactionalEntityManager.getRepository(PostMusic);

      const post = postRepo.create({
        author: { id: userId },
        coverImgUrl: thumbnailImgUrl,
        content,
        likeCount: 0,
        commentCount: 0,
      });
      const savedPost = await postRepo.save(post);

      const postMusics = musicIds.map((musicId, i) =>
        postMusicRepo.create({
          post: { id: savedPost.id },
          music: { id: musicId },
          orderIndex: i,
        }),
      );

      await postMusicRepo.save(postMusics);
    });
  }

  async getPostDetail(postId: string, viewerId: string | null) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: { author: true },
    });

    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    const musicsOfPost = await this.postMusicRepo.findMusicsByPostId(postId);

    const isLiked = viewerId
      ? await this.likeRepo.exists({
          where: {
            userId: viewerId,
            postId,
          },
        })
      : false;

    return this.toGetPostDetailResponseDto({
      post,
      musics: musicsOfPost,
      isLiked,
    });
  }

  async update(
    requestUserId: string,
    postId: string,
    content: string,
  ): Promise<void> {
    const result = await this.postRepo.update(
      {
        id: postId,
        author: { id: requestUserId },
      },
      { content },
    );

    if (!result.affected)
      throw new NotFoundException('수정하려는 게시글을 찾을 수 없습니다.');
  }

  async delete(requestUserId: string, postId: string): Promise<void> {
    const result = await this.postRepo.softDelete({
      id: postId,
      author: { id: requestUserId },
    });

    if (!result.affected)
      throw new NotFoundException('삭제하려는 게시글을 찾을 수 없습니다.');
  }

  private toGetPostDetailResponseDto({
    post,
    musics,
    isLiked,
  }: {
    post: Post;
    musics: MusicResponseDto[];
    isLiked: boolean;
  }): PostResponseDto {
    const author = {
      id: post.author.id,
      nickname: post.author.nickname,
      profileImgUrl: post.author.profileImgUrl,
    };
    const {
      id,
      coverImgUrl,
      content,
      likeCount,
      commentCount,
      createdAt,
      updatedAt,
    } = post;

    // 차이가 1초 이상이면 수정된 것으로 판단
    const isEdited = updatedAt.getTime() - createdAt.getTime() >= 1000;

    return {
      id,
      author,
      coverImgUrl,
      musics,
      content,
      likeCount,
      commentCount,
      createdAt: createdAt.toISOString(),
      isEdited,
      isLiked,
    };
  }

  async getByUserId(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<FindByUserDto> {
    const { date: cursorDate } = this.decodeCursor(cursor);

    const posts = await this.postRepository.getPostsByUser(
      userId,
      limit + 1,
      cursorDate,
    );

    const { targetPosts, hasNext, nextCursor } = this.paginate(posts, limit);

    return {
      posts: targetPosts.map((post) => ({
        postId: post.id,
        coverImgUrl: post.coverImgUrl,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        isMoreThanOneMusic: (post.postMusics?.length ?? 0) > 1,
      })),
      hasNext,
      nextCursor,
    };
  }

  /**
   * 프로필 피드용 조회. 카드 렌더링에 필요한 전체 게시글을 한 번에 반환한다.
   * 게시글 수에 비례해 상세 조회를 반복하지 않도록 작성자/음악은 join으로,
   * 좋아요 여부는 postId 목록 기준 일괄 조회 1회로 처리한다.
   */
  async getFeedByUserId(
    userId: string,
    limit: number,
    cursor: string | undefined,
    viewerId: string | null,
  ): Promise<FindByUserFeedDto> {
    const { date: cursorDate } = this.decodeCursor(cursor);

    const posts = await this.postRepository.getFullPostsByUser(
      userId,
      limit + 1,
      cursorDate,
    );

    const { targetPosts, hasNext, nextCursor } = this.paginate(posts, limit);
    const likedPostIds = await this.findLikedPostIds(
      viewerId,
      targetPosts.map((post) => post.id),
    );

    return {
      posts: targetPosts.map((post) =>
        this.toGetPostDetailResponseDto({
          post,
          musics: this.toOrderedMusics(post.postMusics),
          isLiked: likedPostIds.has(post.id),
        }),
      ),
      hasNext,
      nextCursor,
    };
  }

  /** 조회한 게시글 전체에 대한 viewer의 좋아요 여부를 쿼리 1회로 확인한다. */
  private async findLikedPostIds(
    viewerId: string | null,
    postIds: string[],
  ): Promise<Set<string>> {
    if (!viewerId || postIds.length === 0) return new Set();

    const likes = await this.likeRepo.find({
      where: { userId: viewerId, postId: In(postIds) },
      select: { postId: true },
    });

    return new Set(likes.map((like) => like.postId));
  }

  /**
   * 게시글의 음악을 `orderIndex` 순으로 정렬해 응답 형태로 바꾼다.
   * 정렬을 조회 쿼리에서 하지 않는 이유는 `getFullPostsByUser`의 주석에 있다.
   */
  private toOrderedMusics(
    postMusics: PostMusic[] | undefined,
  ): MusicResponseDto[] {
    return [...(postMusics ?? [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((postMusic) => this.toMusicResponseDto(postMusic.music));
  }

  private toMusicResponseDto(music: Music): MusicResponseDto {
    const {
      id,
      title,
      artistName,
      albumCoverUrl,
      trackUri,
      provider,
      durationMs,
    } = music;

    return {
      id,
      title,
      artistName,
      albumCoverUrl,
      trackUri,
      provider,
      durationMs,
    };
  }

  /** limit + 1건을 조회한 결과에서 다음 페이지 존재 여부와 cursor를 계산한다. */
  private paginate(posts: Post[], limit: number) {
    const hasNext = posts.length > limit;
    const targetPosts = hasNext ? posts.slice(0, limit) : posts;

    let nextCursor: string | undefined = undefined;

    if (hasNext && targetPosts.length > 0) {
      const lastPost = targetPosts[targetPosts.length - 1];
      nextCursor = `${lastPost.createdAt.toISOString()}_${lastPost.id}`;
    }

    return { targetPosts, hasNext, nextCursor };
  }

  private decodeCursor(cursor?: string) {
    if (!cursor)
      return { date: null as Date | null, id: null as string | null };

    const separatorIndex = cursor.lastIndexOf('_');
    if (separatorIndex === -1) return { date: null, id: null };

    const dateString = cursor.substring(0, separatorIndex);
    const idString = cursor.substring(separatorIndex + 1);

    const ms = Date.parse(dateString);
    if (!Number.isFinite(ms)) return { date: null, id: null };

    return { date: new Date(ms), id: idString };
  }
}
