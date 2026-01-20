import { Injectable, NotFoundException } from '@nestjs/common';
import { PlaylistRepository } from './playlist.repository';
import {
  GetAllPlaylistsResDto,
  GetPlaylistDetailResDto,
  MusicResponseDto,
  PlaylistBriefResDto,
} from '@repo/dto';
import { Playlist } from './entities/playlist.entity';

const PLAYLIST_DEFAULT_BASE_NAME = '플레이리스트 ';

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

  async create(userId: string, title?: string): Promise<Playlist> {
    let defaultName: string;
    if (!title) defaultName = await this.buildDefaultPlaylistName(userId);

    return await this.playlistRepo.create(userId, title ?? defaultName!);
  }

  private async buildDefaultPlaylistName(userId: string): Promise<string> {
    // playlist 개수 + 1
    const count = await this.playlistRepo.getCountOfPlaylistOf(userId);
    return `${PLAYLIST_DEFAULT_BASE_NAME}${count + 1}`;
  }

  async getPlaylistDetail(
    playlistId: string,
  ): Promise<GetPlaylistDetailResDto> {
    const playlist = await this.playlistRepo.getPlaylistDetail(playlistId);
    if (!playlist)
      throw new NotFoundException('플레이리스트가 존재하지 않습니다.');

    return this.toGetPlaylistDetailResDto(playlist);
  }

  private toGetPlaylistDetailResDto(playlist: Playlist) {
    const musics: MusicResponseDto[] = (playlist.playlistMusics ?? [])
      .map((pm) => pm.music)
      .map((m) => ({
        id: m.id,
        title: m.title,
        artistName: m.artistName,
        trackUri: m.trackUri,
        albumCoverUrl: m.albumCoverUrl,
        provider: m.provider,
        durationMs: m.durationMs,
      }));

    return {
      id: playlist.id,
      title: playlist.title,
      musics,
    };
  }

  async update(playlistId: string, title: string): Promise<Playlist> {
    const playlist = await this.playlistRepo.findById(playlistId);
    if (!playlist)
      throw new NotFoundException('플레이리스트가 존재하지 않습니다.');

    playlist.title = title;

    return this.playlistRepo.save(playlist);
  }
}
