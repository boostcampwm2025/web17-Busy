import { join } from 'path';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { SeedModule } from './modules/seed/seed.module';
import { NotiModule } from './modules/noti/noti.module';
import { PostModule } from './modules/post/post.module';
import { CommentModule } from './modules/comment/comment.module';
import { FollowModule } from './modules/follow/follow.module';
import { LikeModule } from './modules/like/like.module';
import { MusicModule } from './modules/music/music.module';
import { NowPlaylistModule } from './modules/now-playlist/now-playlist.module';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { UploadModule } from './modules/upload/upload.module';
import { AlgorithmModule } from './modules/algorithm/algorithm.module';
import { TrendingModule } from './modules/trending/trending.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { LogsModule } from './modules/log/logs.module';
import { FeedModule } from './modules/feed/feed.module';

import { InfraModule } from './modules/infra/infra.module';

@Module({
  imports: [
    AuthModule,
    CommentModule,
    FollowModule,
    LikeModule,
    MusicModule,
    NotiModule,
    NowPlaylistModule,
    PlaylistModule,
    PostModule,
    SeedModule,
    UploadModule,
    UserModule,
    AlgorithmModule,
    TrendingModule,
    FeedModule,
    PrivacyModule,
    ScheduleModule.forRoot(),
    LogsModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InfraModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
