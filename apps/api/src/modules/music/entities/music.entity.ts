import { Provider } from 'src/common/constants';
import { BeforeInsert, Column, Entity, PrimaryColumn } from 'typeorm';

import { v7 as uuidV7 } from 'uuid';

@Entity()
export class Music {
  @PrimaryColumn('char', { name: 'music_id', length: 36 })
  id: string;

  @BeforeInsert()
  setId() {
    this.id ??= uuidV7();
  }

  @Column({ name: 'track_uri', length: 1000 })
  trackUri: string;

  @Column('varchar', { length: 255 })
  provider: Provider;

  @Column('varchar', { name: 'album_cover_url', length: 2083 })
  albumCoverUrl: string;

  @Column('varchar', { length: 1000 })
  title: string;

  @Column('varchar', { name: 'artist_name', length: 1000 })
  artistName: string;

  @Column('int', { name: 'duration_ms' })
  durationMs: number;
}
