import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';
import { AuthProvider } from '../auth/types';
import { GetUserDto, SearchUsersResDto } from '@repo/dto';
import { FollowService } from '../follow/follow.service';

type ProviderProfile = {
  provider: AuthProvider;
  providerUserId: string;
  nickname: string;
  email?: string;
  profileImgUrl?: string;
  refreshToken?: string;
};

type UserWithFollowInfo = User & {
  followerCount: number;
  followingCount: number;
  isFollowing?: number | string;
};

@Injectable()
export class UserService {
  private readonly NICKNAME_MAX_LEN = 12;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly followService: FollowService,
  ) {}

  async findOrCreateByProviderUserId(profile: ProviderProfile): Promise<User> {
    const nickname = this.normalizeNickname(
      profile.nickname,
      profile.providerUserId,
    );

    const existing = await this.userRepository.findByProvider(
      profile.provider,
      profile.providerUserId,
    );

    if (existing) {
      return this.userRepository.updateUser(existing, {
        nickname,
        email: profile.email ?? existing.email,
        profileImgUrl: profile.profileImgUrl ?? existing.profileImgUrl,
        providerRefreshToken:
          profile.refreshToken ?? existing.providerRefreshToken,
      });
    }

    return this.userRepository.createUser({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      nickname,
      email: profile.email,
      profileImgUrl: profile.profileImgUrl,
      providerRefreshToken: profile.refreshToken,
    });
  }

  async findOrCreateBySpotifyUserId(profile: {
    spotifyUserId: string;
    nickname: string;
    email: string;
    profileImgUrl: string;
    refreshToken: string;
  }): Promise<{
    id: string;
    nickname: string;
    profileImgUrl?: string | null;
  }> {
    const user = await this.findOrCreateByProviderUserId({
      provider: AuthProvider.SPOTIFY,
      providerUserId: profile.spotifyUserId,
      nickname: profile.nickname,
      email: profile.email,
      profileImgUrl: profile.profileImgUrl,
      refreshToken: profile.refreshToken,
    });

    return {
      id: user.id,
      nickname: user.nickname,
      profileImgUrl: user.profileImgUrl ?? null,
    };
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findUserById(userId);
  }

  private normalizeNickname(input: string | undefined, fallbackSeed: string) {
    const base = (input ?? '').trim().replace(/\s+/g, ' ');
    const candidate = base.length > 0 ? base : `user_${fallbackSeed.slice(-6)}`;
    return candidate.slice(0, this.NICKNAME_MAX_LEN);
  }

  async getUserProfile(
    targetUserId: string,
    userId?: string,
  ): Promise<GetUserDto> {
    const user = await this.userRepository.findWithFollowInfo(
      targetUserId,
      userId,
    );

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // dto 매핑을 위한 타입단언
    const result = user as UserWithFollowInfo;

    return {
      id: result.id,
      nickname: result.nickname,
      profileImgUrl: result.profileImgUrl ?? null,
      bio: result.bio ?? '',
      followerCount: result.followerCount || 0,
      followingCount: result.followingCount || 0,
      isFollowing: !!Number(result.isFollowing),
    };
  }

  async searchUsers(
    keyword: string,
    limit: number,
    cursor?: string,
    currentUserId?: string,
  ): Promise<SearchUsersResDto> {
    const users = await this.userRepository.searchByNickname(
      keyword,
      limit + 1,
      cursor,
    );
    const hasNext = users.length > limit;
    const targetUsers = hasNext ? users.slice(0, limit) : users;

    let followedUserIds = new Set<string>();
    // 아이디가 존재하는 경우 isFollowing 탐색
    if (currentUserId && targetUsers.length > 0) {
      const targetIds = targetUsers.map((u) => u.id);

      const followingIds = await this.followService.getFollowingIds(
        currentUserId,
        targetIds,
      );

      followedUserIds = new Set(followingIds);
    }

    const nextCursor =
      hasNext && targetUsers.length > 0
        ? targetUsers[targetUsers.length - 1].id
        : undefined;

    return {
      users: targetUsers.map((user) => ({
        id: user.id,
        nickname: user.nickname,
        profileImgUrl: user.profileImgUrl ?? null,
        isFollowing: followedUserIds.has(user.id),
      })),
      hasNext,
      nextCursor,
    };
  }
}
