import { Controller, Post, Body } from '@nestjs/common';
import { MusicService } from './music.service';
import { CreateMusicReqDto } from '@repo/dto/music/req/createMusicDTO';
import { CreateMusicResDto } from '@repo/dto/music/res/createMusicDTO';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Post()
  async createMusic(
    @Body() createMusicDto: CreateMusicReqDto,
  ): Promise<CreateMusicResDto> {
    const music = await this.musicService.addMusic(createMusicDto);
    return {
      musicId: music.musicId,
      trackUri: music.trackUri,
      provider: music.provider,
      albumCoverUrl: music.albumCoverUrl,
      title: music.title,
      artistName: music.artistName,
      durationMs: music.durationMs,
    };
  }
}
