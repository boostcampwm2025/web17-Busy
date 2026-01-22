import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FollowRepository } from './follow.repository';
import { Follow } from './entities/follow.entity';
import {
  CreateFollowDto,
  DeleteFollowDto,
  GetUserFollowDto,
  UserDto,
  NotiType,
} from '@repo/dto';
import { NotiService } from '../noti/noti.service';

@Injectable()
export class FollowService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly followRepository: FollowRepository,
    private readonly notiService: NotiService,
  ) {}

  async addFollow(userId: string, createFollowDto: CreateFollowDto) {
    const { otherUserId } = createFollowDto;

    await this.followRepository.createFollow(userId, otherUserId);

    await this.notiService.create({
      type: NotiType.FOLLOW,
      receiverId: otherUserId,
      actorId: userId,
    });

    return { message: '팔로우 성공' };
  }

  async removeFollow(userId: string, deleteFollowDto: DeleteFollowDto) {
    const { otherUserId } = deleteFollowDto;

    await this.followRepository.removeFollow(userId, otherUserId);
    return { message: '팔로우 해제 성공' };
  }

  async getFollowingIds(
    currentUserId: string,
    targetUserIds: string[],
  ): Promise<string[]> {
    return this.followRepository.findFollowingStatus(
      currentUserId,
      targetUserIds,
    );
  }

  async getFollowings(
    targetUserId: string,
    limit: number,
    cursor?: string,
    userId?: string,
  ) {
    const { date: cursorDate } = this.decodeCursor(cursor);

    const follows = await this.followRepository.getFollowings(
      targetUserId,
      limit + 1,
      cursorDate,
    );

    return this.paginate(
      follows,
      limit,
      (follow) => follow.followedUser,
      (follow) => follow.createdAt.toISOString(),
      userId,
    );
  }

  async getFollowers(
    targetUserId: string,
    limit: number,
    cursor?: string,
    userId?: string,
  ) {
    const { date: cursorDate, id: cursorId } = this.decodeCursor(cursor);

    const follows = await this.followRepository.getFollowers(
      targetUserId,
      limit + 1,
      cursorDate,
      cursorId,
    );

    return this.paginate(
      follows,
      limit,
      (follow) => follow.followingUser,
      (follow) => `${follow.createdAt.toISOString()}_${follow.followingUserId}`,
      userId,
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

  private async paginate(
    follows: Follow[],
    limit: number,
    userExtractor: (follow: Follow) => UserDto,
    cursorGenerator: (lastItem: Follow) => string,
    userId?: string | undefined,
  ): Promise<GetUserFollowDto> {
    const hasNext = follows.length > limit;
    const targetFollows = hasNext ? follows.slice(0, limit) : follows;

    // 표시될 유저의 팔로우 여부 확인
    let followingSet = new Set<string>();
    if (userId && targetFollows.length > 0) {
      const targetUserIds = targetFollows.map((f) => userExtractor(f).id);

      const followingIds = await this.getFollowingIds(userId, targetUserIds);

      followingSet = new Set(followingIds);
    }

    const users = targetFollows.map((follow) => {
      const user = userExtractor(follow);
      return {
        id: user.id,
        nickname: user.nickname,
        profileImgUrl: user.profileImgUrl ?? null,
        isFollowing: followingSet.has(user.id),
      };
    });

    let nextCursor: string | undefined = undefined;
    if (hasNext && targetFollows.length > 0) {
      const lastItem = targetFollows[targetFollows.length - 1];
      nextCursor = cursorGenerator(lastItem);
    }
    return {
      users,
      hasNext,
      nextCursor,
    };
  }

  async countFollow(userId: string) {
    const follower = await this.followRepository.countFollowers(userId);
    const following = await this.followRepository.countFollowing(userId);

    return {
      followerCount: follower,
      followingCount: following,
    };
  }
}
