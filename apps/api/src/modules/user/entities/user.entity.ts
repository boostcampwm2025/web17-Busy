import { AuthProvider } from 'src/modules/auth/types';
import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Follow } from 'src/modules/follow/entities/follow.entity';

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class User {
  @PrimaryColumn('char', { name: 'user_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @Column('varchar', { length: 12, nullable: false })
  nickname: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('varchar', { name: 'profile_img_url', length: 2083, nullable: true })
  profileImgUrl: string;

  @Column('varchar', { length: 255, nullable: true })
  bio: string;

  // 내가 팔로우 하는 목록 (Following)
  @OneToMany(() => Follow, (follow) => follow.followingUser)
  followings: Follow[];

  // 나를 팔로우 하는 목록 (Follower)
  @OneToMany(() => Follow, (follow) => follow.followedUser)
  followers: Follow[];

  @Column('varchar', { length: 255, nullable: true })
  provider: AuthProvider;

  @Column('varchar', { name: 'provider_user_id', length: 255, nullable: true })
  providerUserId: string;

  @Column('varchar', {
    name: 'provider_refresh_token',
    length: 1000,
    nullable: true,
  })
  providerRefreshToken: string;
}
