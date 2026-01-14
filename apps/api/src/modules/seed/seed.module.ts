import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { DevSeedService } from './dev-seed.service';
import { Noti } from '../noti/entities/noti.entity';
import { Music } from '../music/entities/music.entity';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Noti, Music, Post, PostMusic])],
  providers: [DevSeedService],
})
export class SeedModule {}
