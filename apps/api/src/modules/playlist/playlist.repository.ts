import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { EntityManager, Repository } from 'typeorm';
import { PlaylistMusic } from './entities/playlist-music.entity';

@Injectable()
export class PlaylistRepository {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,

    @InjectRepository(PlaylistMusic)
    private readonly pmRepo: Repository<PlaylistMusic>,
  ) {}

  async getAllPlaylists(userId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo
      .createQueryBuilder('p')
      .select('p.playlist_id', 'id')
      .addSelect('p.title', 'title')
      .addSelect((sq) => {
        return sq
          .select('COUNT(*)')
          .from('playlist_music', 'pmc')
          .where('pmc.playlist_id = p.playlist_id');
      }, 'tracksCount')
      .addSelect((sq) => {
        return sq
          .select('m.album_cover_url')
          .from('playlist_music', 'pm1')
          .innerJoin('music', 'm', 'm.music_id = pm1.music_id')
          .where('pm1.playlist_id = p.playlist_id')
          .orderBy('pm1.order_index', 'ASC')
          .limit(1);
      }, 'firstAlbumCoverUrl')
      .where('p.owner_id = :userId', { userId })
      .getRawMany();
  }

  async getCountOfPlaylistOf(userId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.count({
      where: {
        owner: { id: userId },
      },
    });
  }

  async create(userId: string, title: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    const playlist = repo.create({
      owner: { id: userId },
      title,
    });

    return await repo.save(playlist);
  }

  async getPlaylistDetail(
    playlistId: string,
    manager?: EntityManager,
  ): Promise<Playlist | null> {
    const repo = this.getPlaylistRepo(manager);

    return await repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.playlistMusics', 'pm')
      .leftJoinAndSelect('pm.music', 'm')
      .where('p.playlist_id = :playlistId', { playlistId })
      .orderBy('pm.order_index', 'ASC')
      .getOne();
  }

  async findById(playlistId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.findOneBy({ id: playlistId });
  }

  async save(playlist: Playlist, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    return await repo.save(playlist);
  }

  async delete(playlistId: string, manager?: EntityManager) {
    const repo = this.getPlaylistRepo(manager);

    const result = await repo.delete({ id: playlistId });

    return result.affected ? result.affected > 0 : false;
  }

  async countMusic(
    playlistId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = this.getPmRepo(manager);

    return await repo.count({
      where: {
        playlist: { id: playlistId },
      },
    });
  }

  async addMusics(
    playlistId: string,
    musicIds: string[],
    firstIndex: number,
    manager?: EntityManager,
  ) {
    const repo = this.getPmRepo(manager);

    const pms = repo.create(
      musicIds.map((mId, i) => ({
        playlist: { id: playlistId },
        music: { id: mId },
        orderIndex: i + firstIndex,
      })),
    );

    return await repo.save(pms);
  }

  private getPlaylistRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(Playlist) : this.playlistRepo;
  }

  private getPmRepo(manager?: EntityManager) {
    return manager ? manager.getRepository(PlaylistMusic) : this.pmRepo;
  }
}
