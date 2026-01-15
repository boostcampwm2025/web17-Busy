import { Injectable } from '@nestjs/common';
import { UpdateNowPlaylistReqDto, GetNowPlaylistResDto } from '@repo/dto';
import { NowPlaylistRepository } from './now-playlist.repository';
import { NowPlaylistMusic } from './entities/now-playlist-music.entity';

@Injectable()
export class NowPlaylistService {
  constructor(private readonly nowPlaylistRepository: NowPlaylistRepository) {}

  async updateNowPlaylist(
    userId: string,
    dto: UpdateNowPlaylistReqDto,
  ): Promise<void> {
    await this.nowPlaylistRepository.refreshPlaylist(userId, dto.musicIds);
  }

  async getNowPlaylist(userId: string): Promise<GetNowPlaylistResDto> {
    const entities = await this.nowPlaylistRepository.findLoadPlaylist(userId);
    const musicList = entities.map((entity) => this.mapToMusicInfo(entity));

    return {
      music: musicList,
    };
  }

  private mapToMusicInfo(entity: NowPlaylistMusic) {
    return {
      musicId: entity.music.id,
      trackUri: entity.music.trackUri,
      provider: entity.music.provider,
      title: entity.music.title,
      artistName: entity.music.artistName,
      albumCoverUrl: entity.music.albumCoverUrl,
      durationMs: entity.music.durationMs,
    };
  }
}
