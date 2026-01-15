import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NowPlaylistMusic } from './entities/now-playlist-music.entity';
import { NowPlaylistController } from './now-playlist.controller';
import { NowPlaylistService } from './now-playlist.service';
import { NowPlaylistRepository } from './now-playlist.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NowPlaylistMusic])],
  controllers: [NowPlaylistController],
  providers: [NowPlaylistService, NowPlaylistRepository],
})
export class NowPlaylistModule {}
