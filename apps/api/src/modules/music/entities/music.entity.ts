import { Provider } from 'src/common/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Music {
  @PrimaryGeneratedColumn('uuid', { name: 'music_id' })
  id: string;

  @Column({ name: 'track_uri' })
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
