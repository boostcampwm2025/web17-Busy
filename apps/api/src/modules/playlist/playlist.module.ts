import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { PlaylistMusic } from './entities/playlist-music.entity';
import { PlaylistRepository } from './playlist.repository';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [TypeOrmModule.forFeature([Playlist, PlaylistMusic]), MusicModule],
  controllers: [PlaylistController],
  providers: [PlaylistService, PlaylistRepository],
})
export class PlaylistModule {}
