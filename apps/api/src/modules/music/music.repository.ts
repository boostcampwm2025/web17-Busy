import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Music } from './index';

@Injectable()
export class MusicRepository extends Repository<Music> {
  constructor(private dataSource: DataSource) {
    super(Music, dataSource.createEntityManager());
  }

  /**
   * Provider와 TrackUri로 이미 존재하는 음악인지 확인합니다.
   */
  async findByUniqueKey(
    provider: Music['provider'],
    trackUri: string,
  ): Promise<Music | null> {
    return this.findOne({
      where: { provider, trackUri },
    });
  }

  /**
   * 음악 ID로 조회합니다.
   */
  async findByMusicId(id: string): Promise<Music | null> {
    return this.findOne({
      where: { id },
    });
  }
}
