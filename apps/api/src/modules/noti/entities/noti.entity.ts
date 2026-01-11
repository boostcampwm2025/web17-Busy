import type { NotiType } from 'src/common/constants';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Noti {
  @PrimaryGeneratedColumn('uuid', { name: 'noti_id' })
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column('varchar', { length: 10 })
  type: NotiType;

  @Column('char', { name: 'related_id', length: 36 })
  relatedId: string;

  @Column('bool', { name: 'is_read' })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createAt: Date;
}
