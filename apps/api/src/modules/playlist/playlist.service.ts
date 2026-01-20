import { Injectable } from '@nestjs/common';
import { PlaylistRepository } from './playlist.repository';
import { GetAllPlaylistsResDto, PlaylistBriefResDto } from '@repo/dto';
import { Playlist } from './entities/playlist.entity';

@Injectable()
export class PlaylistService {
  constructor(private readonly playlistRepo: PlaylistRepository) {}

  async getAllPlaylists(userId: string): Promise<GetAllPlaylistsResDto> {
    const playlists = (await this.playlistRepo.getAllPlaylists(userId)).map(
      this.toPlaylistBriefResDto,
    );

    return { playlists };
  }

  private toPlaylistBriefResDto(row: any): PlaylistBriefResDto {
    return {
      id: row.id,
      title: row.title,
      tracksCount: Number(row.tracksCount ?? 0),
      firstAlbumCoverUrl: row.firstAlbumCoverUrl,
    };
  }
}
