import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PostMusic } from './entities/post-music.entity';
import { MusicResponseDto } from '@repo/dto';

@Injectable()
export class PostMusicRepository extends Repository<PostMusic> {
  constructor(private readonly ds: DataSource) {
    super(PostMusic, ds.createEntityManager());
  }

  /**
   * 게시글의 음악 목록. 프로필 피드 조회와 같은 순서를 보장하려면 `orderIndex` 정렬이 필요하다.
   * 정렬이 없으면 순서가 DB 실행 계획에 의존해 두 경로의 결과가 어긋날 수 있다.
   */
  async findMusicsByPostId(postId: string): Promise<MusicResponseDto[]> {
    return this.createQueryBuilder('pm')
      .innerJoin('pm.music', 'm')
      .where('pm.post = :postId', { postId })
      .orderBy('pm.orderIndex', 'ASC')
      .select([
        'm.id AS id',
        'm.title AS title',
        'm.artistName AS artistName',
        'm.albumCoverUrl AS albumCoverUrl',
        'm.trackUri AS trackUri',
        'm.provider AS provider',
        'm.durationMs As durationMs',
      ])
      .getRawMany<MusicResponseDto>();
  }
}
