import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Noti } from '../noti/entities/noti.entity';
import { Music } from '../music/entities/music.entity';
import {
  SEED_LIKES,
  SEED_MUSICS,
  SEED_NOTIS,
  SEED_POST_MUSICS,
  SEED_POSTS,
  SEED_USERS,
  SEED_PLAYLISTS,
  SEED_PLAYLIST_MUSICS,
} from './seed';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';
import { User } from '../user/entities/user.entity';
import { Like } from '../like/entities/like.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { PlaylistMusic } from '../playlist/entities/playlist-music.entity';

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Noti)
    private readonly notiRepo: Repository<Noti>,

    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostMusic)
    private readonly postMusicRepo: Repository<PostMusic>,

    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,

    @InjectRepository(PlaylistMusic)
    private readonly pmRepo: Repository<PlaylistMusic>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') return;

    await this.userRepo.save(SEED_USERS);
    await this.notiRepo.save(SEED_NOTIS);
    await this.musicRepo.save(SEED_MUSICS);
    await this.postRepo.save(SEED_POSTS);
    await this.postMusicRepo.save(SEED_POST_MUSICS);
    await this.likeRepo.save(SEED_LIKES);
    await this.playlistRepo.save(SEED_PLAYLISTS);
    await this.pmRepo.save(SEED_PLAYLIST_MUSICS);

    console.log('seeding completed');
  }
}
