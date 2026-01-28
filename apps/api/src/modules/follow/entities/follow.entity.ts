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

  // 생성: INSERT 시각만
  @CreateDateColumn({
    name: 'create_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;
}
