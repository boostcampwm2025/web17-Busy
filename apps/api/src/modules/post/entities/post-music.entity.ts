import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Music } from 'src/modules/music/entities/music.entity';

@Entity()
export class PostMusic {
  @PrimaryGeneratedColumn('uuid', { name: 'post_music_id' })
  id: string;

  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Music)
  @JoinColumn({ name: 'music_id' })
  music: Music;

  @Column('int', { name: 'order_index' })
  orderIndex: number;
}
