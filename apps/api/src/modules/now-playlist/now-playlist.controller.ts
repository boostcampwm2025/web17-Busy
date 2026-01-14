import { Body, Controller, Put, Get, Request } from '@nestjs/common';
import { NowPlaylistService } from './now-playlist.service';
import { UpdateNowPlaylistReqDto, GetNowPlaylistResDto } from '@repo/dto';

@Controller('nowPlaylist')
export class NowPlaylistController {
  constructor(private readonly nowPlaylistService: NowPlaylistService) {}

  @Put()
  // @UseGuards(JwtAuthGuard) // 로그인 가드, 구현 후 주석해제
  async updatePlaylist(
    @Request() req, // JWT에서 유저 정보 추출
    @Body() dto: UpdateNowPlaylistReqDto,
  ) {
    // const userId = req.user.id; // 실제로는 JWT에서 꺼내씀
    const userId = '임시-유저-UUID'; // 테스트용 하드코딩

    await this.nowPlaylistService.updateNowPlaylist(userId, dto);

    // 필요시 dto 수정
    return {
      message: '재생목록이 저장되었습니다.',
      count: dto.musicIds.length,
    };
  }

  @Get()
  async getPlaylist(@Request() req): Promise<GetNowPlaylistResDto> {
    // const userId = req.user.id;
    const userId = '임시-유저-UUID'; // 테스트용

    const playlist = await this.nowPlaylistService.getNowPlaylist(userId);

    return playlist;
  }
}
