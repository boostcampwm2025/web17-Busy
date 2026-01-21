import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { PlaylistMusic } from './playlist-music.entity';

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class Playlist {
  @PrimaryColumn('char', { name: 'playlist_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('varchar', { length: 20, nullable: false })
  title: string;

  @OneToMany(() => PlaylistMusic, (pm) => pm.playlist)
  playlistMusics: PlaylistMusic[];
}
