import { Module } from '@nestjs/common';
import { PlaylistService, PlaylistController } from './index';

@Module({
  imports: [],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
