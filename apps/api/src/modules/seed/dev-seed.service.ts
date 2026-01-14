import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') return;

    const seedUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        nickname: '테스트 사용자 1',
        email: 'example111@naver.com',
        profileImgaeUrl: '',
        bio: '하이요~~',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        nickname: '테스트 사용자 2',
        email: 'example222@naver.com',
        profileImgaeUrl: '',
        bio: '하이요~~',
      },
    ];

    await Promise.all(seedUsers.map((u) => this.userRepo.save(u)));
  }
}
