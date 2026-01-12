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
  @PrimaryColumn('char', { name: 'following_user_id', length: 36 })
  followingUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_user_id' })
  followingUser: User;

  @PrimaryColumn('char', { name: 'followed_user_id', length: 36 })
  followedUserId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followed_user_id' })
  followedUser: User;

  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;
}
