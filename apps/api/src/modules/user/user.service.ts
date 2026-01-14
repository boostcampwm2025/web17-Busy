import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // todo - return type -> User Entity로 변경 예정
  async findOrCreateBySpotifyUserId(profile: {
    spotifyUserId: string;
    nickname: string;
    email: string;
    profileImgUrl: string;
    refreshToken: string;
  }): Promise<{
    id: string;
    nickname: string;
    profileImageUrl?: string | null;
  }> {
    return {
      id: '111',
      nickname: 'test user',
      profileImageUrl: null,
    };
  }

  async findById(userId: string) {
    return await this.userRepo.findOneBy({ id: userId });
  }
}
