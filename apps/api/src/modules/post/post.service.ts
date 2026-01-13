import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from './entities/post.entity';
import { PostMusic } from './entities/post-music.entity';
import { Like } from '../like/entities/like.entity';
import { Provider } from 'src/common/constants';
import { MusicRequest } from '@repo/dto/post/req/index';
import { MusicResponse } from '@repo/dto/post/res/index';
import { toGetPostDetailResponseDto } from 'src/common/mappers/toGetPostDetailResponseDto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostMusic)
    private readonly postMusicRepo: Repository<PostMusic>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  async create(
    userId: string,
    musics: MusicRequest[],
    content: string,
    thumbnailImgUrl?: string,
  ): Promise<void> {
    if (musics.length === 0)
      throw new BadRequestException(
        '게시글에는 최소 1곡의 음악이 있어야 합니다.',
      );
    // 트랜잭션 필요
    // 1. find user 필요 x

    // 2. ensure music
    musics.forEach((m) => (m.provider ??= Provider.ITUNES));
    // const ensuredMusics = this.musicService.ensureMusics(musics);

    // 3. thumbnailImgUrl 이 없다면 첫 곡의 앨범 커버 이미지로
    thumbnailImgUrl ??= musics[0].albumCoverUrl;

    // 4. repo.save
    const { id: postId } = await this.postRepo.save({
      author: { id: userId },
      thumbnailImgUrl,
      content,
      likeCount: 0,
      commentCount: 0,
    });

    // musics -> ensuredMusics
    const postMusicsToSave = musics.map((m, i) => ({
      post: { id: postId },
      music: { id: m.musicId },
      orderIndex: i + 1,
    }));

    await this.postMusicRepo.save(postMusicsToSave);
  }

  async getPostDetail(postId: string, viewerId: string | null) {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: { author: true },
    });

    if (!post) return null;

    const musics = await this.postMusicRepo
      .createQueryBuilder('pm')
      .innerJoin('pm.music', 'm')
      .getRawMany<MusicResponse>();

    const isLiked = viewerId
      ? await this.likeRepo.exists({
          where: { postId, userId: viewerId },
        })
      : false;

    return toGetPostDetailResponseDto({ post, musics, isLiked });
  }

  async update(postId: string, content: string): Promise<void> {}

  async delete(postId: string): Promise<void> {}
}
