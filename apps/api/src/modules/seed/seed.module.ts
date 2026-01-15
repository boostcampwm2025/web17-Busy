import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { DevSeedService } from './dev-seed.service';
import { Music } from '../music/entities/music.entity';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';
import { Like } from '../like/entities/like.entity';
import { Noti } from '../noti/entities/noti.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Music, Post, PostMusic, Like, Noti]),
  ],
  providers: [DevSeedService],
})
export class SeedModule {}
