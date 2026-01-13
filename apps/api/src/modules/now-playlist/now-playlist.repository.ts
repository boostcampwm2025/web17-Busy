import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { NowPlaylistMusic } from './entities/now-playlist-music.entity';

@Injectable()
export class NowPlaylistRepository extends Repository<NowPlaylistMusic> {
  constructor(private dataSource: DataSource) {
    super(NowPlaylistMusic, dataSource.createEntityManager());
  }

  async refreshPlaylist(userId: string, musicIds: string[]): Promise<void> {
    // 트랜잭션을 시작합니다.
    await this.manager.transaction(async (transactionalEntityManager) => {
      // 1. 기존 목록 삭제
      await transactionalEntityManager.delete(NowPlaylistMusic, {
        user: { id: userId },
      });

      // 2. 새 목록 엔티티 생성
      const newItems = musicIds.map((musicId, index) => {
        return transactionalEntityManager.create(NowPlaylistMusic, {
          user: { id: userId },
          music: { id: musicId },
          orderIndex: index,
        });
      });

      // 3. 저장
      if (newItems.length > 0) {
        await transactionalEntityManager.save(NowPlaylistMusic, newItems);
      }
    });
  }
}
