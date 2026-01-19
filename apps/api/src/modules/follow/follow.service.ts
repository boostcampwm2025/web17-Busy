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

  async getFollowings(userId: string, limit: number, cursor?: string) {
    let cursorDate: Date | null = null;
    if (cursor) {
      cursorDate = new Date(cursor);
    }

    const follows = await this.followRepository.getFollowings(
      userId,
      limit + 1,
      cursorDate,
    );

    const hasNext = follows.length > limit;
    const targetFollows = hasNext ? follows.slice(0, limit) : follows;

    // 다음 커서 생성
    let nextCursor: string | undefined = undefined;
    if (targetFollows.length > 0) {
      nextCursor =
        targetFollows[targetFollows.length - 1].createdAt.toISOString();
    }

    return {
      users: targetFollows.map((follow) => follow.followedUser),
      hasNext,
      nextCursor,
    };
  }
}
