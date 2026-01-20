import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistMusic } from './entities/playlist-music.entity';
import { Repository } from 'typeorm';
import { GetAllPlaylistsResDto } from '@repo/dto';

@Injectable()
export class PlaylistRepository {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,

    @InjectRepository(PlaylistMusic)
    private readonly playlistMusicRepo: Repository<PlaylistMusic>,
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
}
