import { User } from 'src/modules/user/entities/user.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { v7 as uuidv7 } from 'uuid';

@Entity()
export class Playlist {
  @PrimaryColumn('char', { name: 'playlist_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidv7();
  }

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('varchar', { length: 20 })
  title: string;
}
