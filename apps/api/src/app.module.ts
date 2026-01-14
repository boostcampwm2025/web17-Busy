import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { join } from 'path';
import { SeedModule } from './modules/seed/seed.module';
import { CommentModule } from './modules/comment/comment.module';
import { FollowModule } from './modules/follow/follow.module';
import { LikeModule } from './modules/like/like.module';
import { MusicModule } from './modules/music/music.module';
import { NotiModule } from './modules/noti/noti.module';
import { NowPlaylistModule } from './modules/now-playlist/now-playlist.module';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [
    SeedModule,

    AuthModule,
    CommentModule,
    FollowModule,
    LikeModule,
    MusicModule,
    NotiModule,
    NowPlaylistModule,
    PlaylistModule,
    PostModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '**/*.entity.{ts,js}')],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
