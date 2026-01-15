import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Provider } from '../../common/constants';

type ProviderProfile = {
  provider: Provider;
  providerUserId: string;
  nickname: string;
  email?: string;
  profileImgUrl?: string;
  refreshToken?: string;
};

const NICKNAME_MAX_LEN = 12;

function normalizeNickname(input: string | undefined, fallbackSeed: string) {
  const base = (input ?? '').trim().replace(/\s+/g, ' ');
  const candidate = base.length > 0 ? base : `user_${fallbackSeed.slice(-6)}`;
  return candidate.slice(0, NICKNAME_MAX_LEN);
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOrCreateByProviderUserId(profile: ProviderProfile): Promise<User> {
    const nickname = normalizeNickname(
      profile.nickname,
      profile.providerUserId,
    );

    const existing = await this.userRepo.findOne({
      where: {
        provider: profile.provider,
        providerUserId: profile.providerUserId,
      },
    });

    if (existing) {
      const next = this.userRepo.merge(existing, {
        nickname,
        email: profile.email ?? existing.email,
        profileImgUrl: profile.profileImgUrl ?? existing.profileImgUrl,
        providerRefreshToken:
          profile.refreshToken ?? existing.providerRefreshToken,
      });

      return this.userRepo.save(next);
    }

    const created = this.userRepo.create({
      provider: profile.provider,
      providerUserId: profile.providerUserId,
      nickname,
      email: profile.email,
      profileImgUrl: profile.profileImgUrl,
      providerRefreshToken: profile.refreshToken,
    });

    return this.userRepo.save(created);
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
      provider: Provider.SPOTIFY,
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

  async findById(userId: string) {
    return this.userRepo.findOneBy({ id: userId });
  }
}
