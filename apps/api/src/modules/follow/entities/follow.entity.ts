import { User } from 'src/modules/user/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Follow {
  @PrimaryColumn('uuid', { name: 'following_user_id' })
  followingUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'following_user_id' })
  followingUser: User;

  @PrimaryColumn('uuid', { name: 'followed_user_id' })
  followedUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'followed_user_id' })
  followedUser: User;

  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;
}
