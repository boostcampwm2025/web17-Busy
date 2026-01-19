import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository, LessThan, FindOptionsWhere } from 'typeorm';

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

    // 커서(날짜)가 있다면 그보다 과거의 데이터를 조회
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
        createdAt: 'DESC', // 최신순 정렬
      },
      take: take, // limit + 1개를 가져옴
    });
  }
}
