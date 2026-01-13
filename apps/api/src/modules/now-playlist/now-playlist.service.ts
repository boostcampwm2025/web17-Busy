import { Injectable } from '@nestjs/common';
import { UpdateNowPlaylistReqDto } from '@repo/dto/now-playlist/req/update-now-playlist.dto';
import { NowPlaylistRepository } from './now-playlist.repository';

@Injectable()
export class NowPlaylistService {
  constructor(private readonly nowPlaylistRepository: NowPlaylistRepository) {}

  async updateNowPlaylist(
    userId: string,
    dto: UpdateNowPlaylistReqDto,
  ): Promise<void> {
    await this.nowPlaylistRepository.refreshPlaylist(userId, dto.musicIds);
  }
}
