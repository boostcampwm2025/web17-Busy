import { Music } from 'src/modules/music/entities/music.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class NowPlaylistMusic {
  @PrimaryColumn('char', { name: 'now_playlist_music_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Music, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'music_id' })
  music: Music;

  @Column('int', { name: 'order_index', nullable: false })
  orderIndex: number;
}
