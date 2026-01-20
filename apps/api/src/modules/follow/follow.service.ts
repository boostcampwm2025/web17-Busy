import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FollowRepository } from './follow.repository';
import { Follow } from './entities/follow.entity';
import {
  CreateFollowDto,
  DeleteFollowDto,
  GetUserFollowDto,
  UserDto,
} from '@repo/dto';

@Injectable()
export class FollowService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly followRepository: FollowRepository,
  ) {}

  async addFollow(userId: string, createFollowDto: CreateFollowDto) {
    const { otherUserId } = createFollowDto;

    await this.followRepository.createFollow(userId, otherUserId);
    return { message: '팔로우 성공' };
  }

  async removeFollow(userId: string, deleteFollowDto: DeleteFollowDto) {
    const { otherUserId } = deleteFollowDto;

    await this.followRepository.removeFollow(userId, otherUserId);
    return { message: '팔로우 해제 성공' };
  }

  async getFollowings(userId: string, limit: number, cursor?: string) {
    const { date: cursorDate } = this.decodeCursor(cursor);

    const follows = await this.followRepository.getFollowings(
      userId,
      limit + 1,
      cursorDate,
    );

    return this.paginate(
      follows,
      limit,
      (follow) => follow.followedUser,
      (follow) => follow.createdAt.toISOString(),
    );
  }

  async getFollowers(userId: string, limit: number, cursor?: string) {
    const { date: cursorDate, id: cursorId } = this.decodeCursor(cursor);

    const follows = await this.followRepository.getFollowers(
      userId,
      limit + 1,
      cursorDate,
      cursorId,
    );

    return this.paginate(
      follows,
      limit,
      (follow) => follow.followingUser,
      (follow) => `${follow.createdAt.toISOString()}_${follow.followingUserId}`,
    );
  }

  // 커서 문자열 파싱 Date_Id
  private decodeCursor(cursor?: string): {
    date: Date | null;
    id: string | null;
  } {
    if (!cursor) {
      return { date: null, id: null };
    }

    const splitIndex = cursor.lastIndexOf('_');

    if (splitIndex !== -1) {
      return {
        date: new Date(cursor.substring(0, splitIndex)),
        id: cursor.substring(splitIndex + 1),
      };
    } else {
      return {
        date: new Date(cursor),
        id: null,
      };
    }
  }

  private paginate(
    follows: Follow[],
    limit: number,
    userMapper: (follow: Follow) => UserDto,
    cursorGenerator: (lastItem: Follow) => string,
  ): GetUserFollowDto {
    const hasNext = follows.length > limit;
    const targetFollows = hasNext ? follows.slice(0, limit) : follows;

    let nextCursor: string | undefined = undefined;

    if (hasNext && targetFollows.length > 0) {
      const lastItem = targetFollows[targetFollows.length - 1];
      nextCursor = cursorGenerator(lastItem);
    }

    return {
      users: targetFollows.map(userMapper),
      hasNext,
      nextCursor,
    };
  }
}
