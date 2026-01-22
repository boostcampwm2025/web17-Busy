import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository, LessThan, FindOptionsWhere, In } from 'typeorm';

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

  async getFollowings(
    userId: string,
    take: number,
    cursorDate: Date | null,
  ): Promise<Follow[]> {
    const whereOption: FindOptionsWhere<Follow> = {
      followingUserId: userId,
    };

    if (cursorDate) {
      whereOption.createdAt = LessThan(cursorDate);
    }

    return await this.repository.find({
      where: whereOption,
      relations: {
        followedUser: true, // 팔로우 대상 유저 정보 조인
      },
      select: {
        followingUserId: true,
        followedUserId: true,
        createdAt: true,
        followedUser: {
          id: true,
          nickname: true,
          profileImgUrl: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: take,
    });
  }

  async getFollowers(
    userId: string,
    take: number,
    cursorDate: Date | null,
    cursorId: string | null,
  ): Promise<Follow[]> {
    const commonWhere = { followedUserId: userId };

    let whereOption: FindOptionsWhere<Follow> | FindOptionsWhere<Follow>[];

    if (cursorDate && cursorId) {
      whereOption = [
        {
          ...commonWhere,
          createdAt: LessThan(cursorDate),
        },
        {
          ...commonWhere,
          createdAt: cursorDate,
          followingUserId: LessThan(cursorId),
        },
      ];
    } else {
      whereOption = commonWhere;
    }

    return await this.repository.find({
      where: whereOption,
      relations: {
        followingUser: true,
      },
      select: {
        followingUserId: true,
        followedUserId: true,
        createdAt: true,
        followingUser: {
          id: true,
          nickname: true,
          profileImgUrl: true,
        },
      },
      order: {
        createdAt: 'DESC',
        followingUserId: 'DESC',
      },
      take: take,
    });
  }

  async findFollowingStatus(
    currentUserId: string,
    targetUserIds: string[],
  ): Promise<string[]> {
    if (targetUserIds.length === 0) {
      return [];
    }

    const follows = await this.repository.find({
      where: {
        followingUserId: currentUserId,
        followedUserId: In(targetUserIds),
      },
      select: {
        followedUserId: true,
      },
    });

    return follows.map((follow) => follow.followedUserId);
  }

  // 특정 유저의 팔로우 수
  async countFollowing(userId: string): Promise<number> {
    return this.repository.count({
      where: {
        followingUserId: userId,
      },
    });
  }

  // 특정 유저의 팔로워 수
  async countFollowers(userId: string): Promise<number> {
    return this.repository.count({
      where: {
        followedUserId: userId,
      },
    });
  }
}
