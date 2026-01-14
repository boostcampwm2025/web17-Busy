import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { Noti } from '../noti/entities/noti.entity';
import { NotiType } from 'src/common/constants';

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Noti)
    private readonly notiRepo: Repository<Noti>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') return;

    await this.seedUsers();
    await this.seedNotis();
  }

  private async seedUsers() {
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

  private async seedNotis() {
    const RECEIVER_ID = '11111111-1111-1111-1111-111111111111';
    const ACTOR_ID = '22222222-2222-2222-2222-222222222222';

    const seedNotis: Array<Partial<Noti>> = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        receiver: { id: RECEIVER_ID } as User,
        actor: { id: ACTOR_ID } as User,
        type: NotiType.COMMENT,
        relatedId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // 예: postId
        isRead: false,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        receiver: { id: RECEIVER_ID } as User,
        actor: { id: ACTOR_ID } as User,
        type: NotiType.LIKE,
        relatedId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // 예: postId
        isRead: false,
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        receiver: { id: RECEIVER_ID } as User,
        actor: { id: ACTOR_ID } as User,
        type: NotiType.FOLLOW,
        isRead: true,
      },
    ];

    await Promise.all(seedNotis.map((n) => this.notiRepo.save(n)));
  }
}
