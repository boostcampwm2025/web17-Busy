import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Playlist } from './playlist.entity';
import { Music } from 'src/modules/music/entities/music.entity';

@Entity()
export class PlaylistMusic {
  @PrimaryGeneratedColumn('uuid', { name: 'playlist_music_id' })
  id: string;

  @ManyToOne(() => Playlist)
  @JoinColumn({ name: 'playlist_id' })
  playlist: Playlist;

  @ManyToOne(() => Music)
  @JoinColumn({ name: 'music_id' })
  music: Music;

  @Column('int', { name: 'order_index' })
  orderIndex: number;
}
