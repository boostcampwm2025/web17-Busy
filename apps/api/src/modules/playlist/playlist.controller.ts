import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';

@UseGuards(AuthGuard)
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  // 전체 플리 조회
  @Get()
  getAllPlaylists(@UserId() userId: string) {}

  // 새로운 플리 추가
  @Post()
  createPlaylist(@UserId() userId: string) {}

  // 플리 상세 조회
  @Get(':id')
  getPlaylistById(@UserId() userId: string) {}

  // 플리 제목 수정
  @Patch(':id')
  patchTitle(@UserId() userId: string) {}

  // 플리 삭제
  @Delete(':id')
  deletePlaylist(@UserId() userId: string) {}

  // 플리에 음악 추가
  @Post(':id/music')
  addMusicToPlaylist(@UserId() userId: string) {}

  // 플리 음악 순서 변경
  @Put(':id/music')
  changeMusicOrderOfPlaylist(@UserId() userId: string) {}

  // 플리에서 음악 제거
  @Delete(':id/music/:orderIndex')
  deleteMusicFromPlaylist(@UserId() userId: string) {}
}
