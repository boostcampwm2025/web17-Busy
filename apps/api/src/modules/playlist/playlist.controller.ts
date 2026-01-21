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
  AddMusicsToPlaylist,
  AddMusicToPlaylistReqDto,
  CreatePlaylistReqDto,
  GetAllPlaylistsResDto,
  GetPlaylistDetailResDto,
  PlaylistResDto,
  UpdateMusicsOrderOfPlaylistReqDto,
  UpdateTitlePlaylitReqDto,
} from '@repo/dto';

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
  ): Promise<PlaylistResDto> {
    const { title } = dto;
    const playlist = await this.playlistService.create(userId, title);
    return {
      id: playlist.id,
      title: playlist.title,
    };
  }

  // 플리 상세 조회
  @Get(':id')
  async getPlaylistById(
    @UserId() userId: string,
    @Param('id') playlistId: string,
  ): Promise<GetPlaylistDetailResDto> {
    return await this.playlistService.getPlaylistDetail(userId, playlistId);
  }

  // 플리 제목 수정
  @Patch(':id')
  async patchTitle(
    @UserId() userId: string,
    @Param('id') playlistId: string,
    @Body() dto: UpdateTitlePlaylitReqDto,
  ): Promise<PlaylistResDto> {
    const { title } = dto;
    const playlist = await this.playlistService.update(
      userId,
      playlistId,
      title,
    );
    return {
      id: playlist.id,
      title: playlist.title,
    };
  }

  // 플리 삭제
  @Delete(':id')
  async deletePlaylist(
    @UserId() userId: string,
    @Param('id') playlistId: string,
  ): Promise<{ ok: true }> {
    await this.playlistService.delete(userId, playlistId);
    return { ok: true };
  }

  // 플리에 음악 추가
  @Post(':id/music')
  async addMusicsToPlaylist(
    @UserId() userId: string,
    @Param('id') playlistId: string,
    @Body() dto: AddMusicToPlaylistReqDto,
  ): Promise<AddMusicsToPlaylist> {
    const { musics } = dto;
    const addedMusics = await this.playlistService.addMusics(
      userId,
      playlistId,
      musics,
    );
    return { addedMusics };
  }

  // 플리 음악 순서 변경
  @Put(':id/music')
  async changeMusicOrderOfPlaylist(
    @UserId() userId: string,
    @Param('id') playlistId: string,
    @Body() dto: UpdateMusicsOrderOfPlaylistReqDto,
  ): Promise<{ ok: true }> {
    const { musicIds } = dto;
    await this.playlistService.changeMusicOrder(userId, playlistId, musicIds);
    return { ok: true };
  }
}
