import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Music, MusicController, MusicService } from './index';
import { MusicRepository } from './music.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Music])],
  controllers: [MusicController],
  providers: [MusicService, MusicRepository],
  exports: [MusicService],
})
export class MusicModule {}
