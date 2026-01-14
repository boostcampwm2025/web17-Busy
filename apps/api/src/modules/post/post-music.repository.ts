import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PostMusic } from './index';
import { MusicResponse } from '@repo/dto';

@Injectable()
export class PostMusicRepository extends Repository<PostMusic> {
  constructor(private readonly ds: DataSource) {
    super(PostMusic, ds.createEntityManager());
  }

  async findMusicsByPostId(postId: string): Promise<MusicResponse[]> {
    return this.createQueryBuilder('pm')
      .innerJoin('pm.music', 'm')
      .where('pm.postId = :postId', { postId })
      .select([
        'm.id AS musicId',
        'm.title AS title',
        'm.artistName AS artistName',
        'm.albumCoverUrl AS albumCoverUrl',
        'm.trackUri AS trackUri',
      ])
      .getRawMany<MusicResponse>();
  }
}
