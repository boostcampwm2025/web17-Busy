import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FollowRepository } from './follow.repository';
import { CreateFollowDto, DeleteFollowDto } from '@repo/dto';

@Injectable()
export class FollowService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly followRepository: FollowRepository,
  ) {}

  async addFollow(userId: string, createFollowDto: CreateFollowDto) {
    const { orderUserId } = createFollowDto;

    await this.followRepository.createFollow(userId, orderUserId);
    return { message: '팔로우 성공' };
  }

  async removeFollow(userId: string, deleteFollowDto: DeleteFollowDto) {
    const { orderUserId } = deleteFollowDto;

    await this.followRepository.removeFollow(userId, orderUserId);
    return { message: '팔로우 해제 성공' };
  }
}
