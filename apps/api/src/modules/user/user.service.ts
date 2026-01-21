import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';
import { AuthProvider } from '../auth/types';
import { GetUserDto } from '@repo/dto';

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

  constructor(private readonly userRepository: UserRepository) {}

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
}
