import { Body, Controller, Put, Get, Request, UseGuards } from '@nestjs/common';
import { NowPlaylistService } from './now-playlist.service';
import { UpdateNowPlaylistReqDto, GetNowPlaylistResDto } from '@repo/dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';

@Controller('nowPlaylist')
export class NowPlaylistController {
  constructor(private readonly nowPlaylistService: NowPlaylistService) {}

  @Put()
  @UseGuards(AuthGuard)
  async updatePlaylist(
    @UserId() userId: string,
    @Body() dto: UpdateNowPlaylistReqDto,
  ) {
    await this.nowPlaylistService.updateNowPlaylist(userId, dto);

    // 필요시 dto 수정
    return {
      message: '재생목록이 저장되었습니다.',
      count: dto.musicIds.length,
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  async getPlaylist(@UserId() userId: string): Promise<GetNowPlaylistResDto> {
    const playlist = await this.nowPlaylistService.getNowPlaylist(userId);

    return playlist;
  }
}
