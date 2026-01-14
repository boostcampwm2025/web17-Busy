import { Injectable } from '@nestjs/common';
import { CreateMusicResDto, CreateMusicReqDto } from '@repo/dto';
import { MusicRepository } from './music.repository';
import { Music } from './index';

@Injectable()
export class MusicService {
  constructor(private readonly musicRepository: MusicRepository) {}

  async addMusic(dto: CreateMusicReqDto): Promise<CreateMusicResDto> {
    const { provider, trackUri } = dto;

    // 1. 이미 존재하는지 확인 (커스텀 리포지토리 메서드 사용)
    const existingMusic = await this.musicRepository.findByUniqueKey(
      provider as Music['provider'],
      trackUri,
    );

    if (existingMusic) {
      return this.toResDto(existingMusic);
    }

    // 2. 없으면 엔티티 생성
    const newMusic = this.musicRepository.create({
      ...dto,
      provider: dto.provider as any,
    });

    // 3. 저장
    const savedMusic = await this.musicRepository.save(newMusic);

    return this.toResDto(savedMusic);
  }

  private toResDto(music: Music): CreateMusicResDto {
    return {
      id: music.id,
      trackUri: music.trackUri,
      provider: music.provider as any,
      albumCoverUrl: music.albumCoverUrl,
      title: music.title,
      artistName: music.artistName,
      durationMs: music.durationMs,
    };
  }
}
