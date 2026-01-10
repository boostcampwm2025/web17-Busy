import { Module } from '@nestjs/common';
import { NowPlaylistController } from './now-playlist.controller';
import { NowPlaylistService } from './now-playlist.service';

@Module({
  imports: [],
  controllers: [NowPlaylistController],
  providers: [NowPlaylistService],
})
export class NowPlaylistModule {}
