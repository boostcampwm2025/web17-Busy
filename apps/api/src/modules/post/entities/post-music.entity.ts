import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Music } from 'src/modules/music/entities/music.entity';

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class PostMusic {
  @PrimaryColumn('char', { name: 'post_music_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }
  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Music)
  @JoinColumn({ name: 'music_id' })
  music: Music;

  @Column('int', { name: 'order_index' })
  orderIndex: number;
}
