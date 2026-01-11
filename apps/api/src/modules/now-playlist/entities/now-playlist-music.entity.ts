import { Music } from 'src/modules/music/entities/music.entity';
import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class NowPlaylistMusic {
  @PrimaryGeneratedColumn('uuid', { name: 'now_playlist_music_id' })
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Music)
  @JoinColumn({ name: 'music_id' })
  music: Music;

  @Column('int', { name: 'order_index' })
  orderIndex: number;
}
