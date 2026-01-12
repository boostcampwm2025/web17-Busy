import type { NotiType } from 'src/common/constants';
import { User } from 'src/modules/user/entities/user.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { v7 as uuidv7 } from 'uuid';

@Entity()
export class Noti {
  @PrimaryColumn('char', { name: 'noti_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidv7();
  }

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
