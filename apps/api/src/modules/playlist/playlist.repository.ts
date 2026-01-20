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

  async getAllPlaylists(userId: string) {
    return await this.playlistRepo
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

  async getCountOfPlaylistOf(userId: string) {
    return await this.playlistRepo.count({
      where: {
        owner: { id: userId },
      },
    });
  }

  async create(userId: string, title: string) {
    console.log('플리 레포', title);
    const playlist = this.playlistRepo.create({
      owner: { id: userId },
      title,
    });

    return await this.playlistRepo.save(playlist);
  }

  async getPlaylistDetail(playlistId: string): Promise<Playlist | null> {
    return await this.playlistRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.playlistMusics', 'pm')
      .leftJoinAndSelect('pm.music', 'm')
      .where('p.playlist_id = :playlistId', { playlistId })
      .orderBy('pm.order_index', 'ASC')
      .getOne();
  }

  async findById(id: string) {
    return await this.playlistRepo.findOneBy({ id });
  }

  async save(playlist: Playlist) {
    return await this.playlistRepo.save(playlist);
  }

  async delete(id: string) {
    const result = await this.playlistRepo.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }

  async countMusic(id: string, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(PlaylistMusic) : this.pmRepo;

    return await repo.count({
      where: {
        playlist: { id },
      },
    });
  }

  async addMusics(
    id: string,
    musicIds: string[],
    firstIndex: number,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(PlaylistMusic) : this.pmRepo;

    const pms = repo.create(
      musicIds.map((mId, i) => ({
        playlist: { id },
        music: { id: mId },
        orderIndex: i + firstIndex,
      })),
    );

    return await repo.save(pms);
  }
}
