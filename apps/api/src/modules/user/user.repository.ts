import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthProvider } from '../auth/types';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findByProvider(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<User | null> {
    return this.repository.findOne({
      where: {
        provider,
        providerUserId,
      },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.repository.findOneBy({ id: userId });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  async updateUser(user: User, data: Partial<User>): Promise<User> {
    const mergedUser = this.repository.merge(user, data);
    return this.repository.save(mergedUser);
  }

  createQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }

  async findWithFollowInfo(targetUserId: string, currentUserId?: string) {
    const qb = this.repository
      .createQueryBuilder('user')
      .where('user.id = :targetUserId', { targetUserId });

    qb.loadRelationCountAndMap('user.followerCount', 'user.followers');
    qb.loadRelationCountAndMap('user.followingCount', 'user.followings');

    // 팔로우 중인지 확인 (로그인 한 경우만)
    if (currentUserId) {
      qb.loadRelationCountAndMap(
        'user.isFollowing',
        'user.followers',
        'follow',
        (qb) =>
          qb.where('follow.followingUserId = :currentUserId', {
            currentUserId,
          }),
      );
    }

    return qb.getOne();
  }
}
