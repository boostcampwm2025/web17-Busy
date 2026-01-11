import type { Provider } from 'src/common/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id: string;

  @Column('varchar', { length: 12 })
  nickname: string;

  @Column('varchar', { length: 255 })
  email: string;

  @Column('varchar', { name: 'profile_img_url', length: 2083 })
  profileImgUrl: string;

  @Column('varchar', { length: 255 })
  bio: string;

  @Column('varchar', { length: 255 })
  provider: Provider;

  @Column('varchar', { name: 'provider_user_id', length: 255 })
  providerUserId: string;

  @Column('varchar', { name: 'provider_refresh_token', length: 1000 })
  providerRefreshToken: string;
}
