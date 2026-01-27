import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PostRepository } from './post.repository';
import { Post } from './entities/post.entity';
import { PostMusic } from './entities/post-music.entity';
import {
  MusicRequestDto,
  MusicResponseDto,
  MusicProvider,
  PostResponseDto,
  FindByUserDto,
} from '@repo/dto';
import { PostMusicRepository } from './post-music.repository';
import { MusicService } from '../music/music.service';
import { Like } from '../like/entities/like.entity';
import { TrendingService } from '../trending/trending.service';

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
    private readonly trendingService: TrendingService,
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

    this.trendingService.addInteraction(postId, 'view');

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

    const hasNext = posts.length > limit;
    const targetPosts = hasNext ? posts.slice(0, limit) : posts;

    let nextCursor: string | undefined = undefined;

    if (hasNext && targetPosts.length > 0) {
      const lastPost = targetPosts[targetPosts.length - 1];
      nextCursor = `${lastPost.createdAt.toISOString()}_${lastPost.id}`;
    }

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

  private decodeCursor(cursor?: string) {
    if (!cursor) {
      return { date: null, id: null };
    }

    const separatorIndex = cursor.lastIndexOf('_');
    if (separatorIndex === -1) {
      return { date: null, id: null };
    }

    const dateString = cursor.substring(0, separatorIndex);
    const idString = cursor.substring(separatorIndex + 1);

    return {
      date: new Date(dateString),
      id: idString,
    };
  }
}
