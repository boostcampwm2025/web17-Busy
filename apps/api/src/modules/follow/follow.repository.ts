import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FollowRepository {
  constructor(
    @InjectRepository(Follow)
    private readonly repository: Repository<Follow>,
  ) {}

  async createFollow(
    followingUserId: string,
    followedUserId: string,
  ): Promise<void> {
    await this.repository.insert({
      followingUserId,
      followedUserId,
    });
  }

  async removeFollow(
    followingUserId: string,
    followedUserId: string,
  ): Promise<void> {
    await this.repository.delete({
      followingUserId,
      followedUserId,
    });
  }
}
