import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { NowPlaylistMusic } from './entities/now-playlist-music.entity';

const dedupePreserveOrder = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

@Injectable()
export class NowPlaylistRepository extends Repository<NowPlaylistMusic> {
  constructor(private dataSource: DataSource) {
    super(NowPlaylistMusic, dataSource.createEntityManager());
  }

  async refreshPlaylist(userId: string, musicIds: string[]): Promise<void> {
    const uniqueIds = dedupePreserveOrder(musicIds);

    await this.manager.transaction(async (em) => {
      // (선택) 해당 유저 row 락 - 동시 요청 순서 안정화
      await em
        .createQueryBuilder(NowPlaylistMusic, 'npm')
        .setLock('pessimistic_write')
        .where('npm.user_id = :userId', { userId })
        .getMany();

      // 1) 기존 목록 삭제
      await em.delete(NowPlaylistMusic, { user: { id: userId } });

      // 2) 새 목록 생성
      const newItems = uniqueIds.map((musicId, index) =>
        em.create(NowPlaylistMusic, {
          user: { id: userId },
          music: { id: musicId },
          orderIndex: index,
        }),
      );

      // 3) 저장
      if (newItems.length > 0) {
        await em.save(NowPlaylistMusic, newItems);
      }
    });
  }

  async findLoadPlaylist(userId: string): Promise<NowPlaylistMusic[]> {
    return this.find({
      where: { user: { id: userId } },
      relations: ['music'],
      order: { orderIndex: 'ASC' },
    });
  }
}
