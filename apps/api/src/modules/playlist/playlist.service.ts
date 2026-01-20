import { Injectable, NotFoundException } from '@nestjs/common';
import { PlaylistRepository } from './playlist.repository';
import {
  GetAllPlaylistsResDto,
  GetPlaylistDetailResDto,
  MusicRequestDto,
  MusicResponseDto,
  PlaylistBriefResDto,
} from '@repo/dto';
import { Playlist } from './entities/playlist.entity';
import { MusicService } from '../music/music.service';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const PLAYLIST_DEFAULT_BASE_NAME = '플레이리스트 ';

@Injectable()
export class PlaylistService {
  constructor(
    private readonly playlistRepo: PlaylistRepository,
    private readonly musicService: MusicService,

    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

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
    userId: string,
    playlistId: string,
  ): Promise<GetPlaylistDetailResDto> {
    const playlist = await this.playlistRepo.getPlaylistDetail(
      userId,
      playlistId,
    );
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

  async update(
    userId: string,
    playlistId: string,
    title: string,
  ): Promise<Playlist> {
    const playlist = await this.playlistRepo.findById(userId, playlistId);
    if (!playlist)
      throw new NotFoundException('플레이리스트가 존재하지 않습니다.');

    playlist.title = title;

    return this.playlistRepo.save(playlist);
  }

  async delete(userId: string, playlistId: string): Promise<void> {
    const isDeleted = await this.playlistRepo.delete(userId, playlistId);

    if (!isDeleted)
      throw new NotFoundException('플레이리스트가 존재하지 않습니다.');
  }

  async addMusics(
    userId: string,
    playlistId: string,
    musics: MusicRequestDto[],
  ): Promise<void> {
    const playlist = await this.playlistRepo.findById(userId, playlistId);
    if (!playlist)
      throw new NotFoundException('플레이리스트가 존재하지 않습니다.');

    const musicIds = await Promise.all(
      musics.map(async (m) => {
        if (m.id) return m.id;
        const { id } = await this.musicService.addMusic(m);
        return id;
      }),
    );

    return await this.ds.transaction(async (tx) => {
      const count = await this.playlistRepo.countMusic(playlistId, tx);
      const firstIndex = count;

      await this.playlistRepo.addMusics(playlistId, musicIds, firstIndex, tx);
    });
  }

  async changeMusicOrder(
    userId: string,
    playlistId: string,
    musicIds: string[],
  ) {
    const playlist = await this.playlistRepo.findById(userId, playlistId);
    if (!playlist)
      throw new NotFoundException('플레이리스트가 존재하지 않습니다.');

    return await this.ds.transaction(async (tx) => {
      await this.playlistRepo.deleteAllMusics(playlistId, tx);
      await this.playlistRepo.addMusics(playlistId, musicIds, 0, tx);
    });
  }
}
