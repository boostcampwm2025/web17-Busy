import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Post } from './entities/post.entity';
import { PostMusic } from './entities/post-music.entity';
import {
  MusicRequestDto,
  MusicResponseDto,
  MusicProvider,
  GetPostDetailResponseDto,
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

    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    private readonly postMusicRepo: PostMusicRepository,

    private readonly musicService: MusicService,
  ) {}

  async create(
    userId: string,
    musics: MusicRequestDto[],
    content: string,
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
  }): GetPostDetailResponseDto {
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
}
