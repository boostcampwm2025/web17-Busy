import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import {
  AddMusicToPlaylistReqDto,
  CreatePlaylistReqDto,
  GetAllPlaylistsResDto,
  GetPlaylistDetailResDto,
  UpdateMusicsOrderOfPlaylistReqDto,
  UpdateTitlePlaylitReqDto,
} from '@repo/dto';
import { Playlist } from './entities/playlist.entity';

@UseGuards(AuthGuard)
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  // 전체 플리 조회
  @Get()
  async getAllPlaylists(
    @UserId() userId: string,
  ): Promise<GetAllPlaylistsResDto> {
    return await this.playlistService.getAllPlaylists(userId);
  }

  // 새로운 플리 추가
  @Post()
  async createPlaylist(
    @UserId() userId: string,
    @Body() dto: CreatePlaylistReqDto,
  ): Promise<{ ok: true; playlist: Playlist }> {
    const { title } = dto;
    const playlist = await this.playlistService.create(userId, title);
    return { ok: true, playlist };
  }

  // 플리 상세 조회
  @Get(':id')
  async getPlaylistById(
    @Param('id') playlistId: string,
  ): Promise<GetPlaylistDetailResDto> {
    return await this.playlistService.getPlaylistDetail(playlistId);
  }

  // 플리 제목 수정
  @Patch(':id')
  async patchTitle(
    @Param('id') playlistId: string,
    @Body() dto: UpdateTitlePlaylitReqDto,
  ): Promise<{ ok: true; playlist: Playlist }> {
    const { title } = dto;
    const playlist = await this.playlistService.update(playlistId, title);
    return { ok: true, playlist };
  }

  // 플리 삭제
  @Delete(':id')
  async deletePlaylist(
    @UserId() userId: string,
    @Param('id') playlistId: string,
  ): Promise<{ ok: true }> {
    return { ok: true };
  }

  // 플리에 음악 추가
  @Post(':id/music')
  async addMusicToPlaylist(
    @UserId() userId: string,
    @Param('id') playlistId: string,
    @Body() dto: AddMusicToPlaylistReqDto,
  ): Promise<{ ok: true }> {
    const { musics } = dto;
    return { ok: true };
  }

  // 플리 음악 순서 변경
  @Put(':id/music')
  async changeMusicOrderOfPlaylist(
    @UserId() userId: string,
    @Param('id') playlistId: string,
    @Body() dto: UpdateMusicsOrderOfPlaylistReqDto,
  ): Promise<{ ok: true }> {
    const { musicIds } = dto;
    return { ok: true };
  }
}
