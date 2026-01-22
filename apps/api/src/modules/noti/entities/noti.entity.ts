import { NotiType } from '@repo/dto';
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

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class Noti {
  @PrimaryColumn('char', { name: 'noti_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column('varchar', { length: 10, nullable: false })
  type: NotiType;

  @Column('char', { name: 'related_id', length: 36, nullable: true })
  relatedId: string;

  @Column('bool', { name: 'is_read', nullable: false, default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
