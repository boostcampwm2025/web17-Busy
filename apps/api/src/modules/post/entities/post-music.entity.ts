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

import { v7 as uuidv7 } from 'uuid';

@Entity()
export class PostMusic {
  @PrimaryColumn('uuid', { name: 'post_music_id' })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidv7();
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
