import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NowPlaylistController,
  NowPlaylistService,
  NowPlaylistMusic,
} from './index';
import { NowPlaylistRepository } from './now-playlist.repository';

@Module({
  imports: [TypeOrmModule.forFeature([NowPlaylistMusic])],
  controllers: [NowPlaylistController],
  providers: [NowPlaylistService, NowPlaylistRepository],
})
export class NowPlaylistModule {}
