import { join } from 'path';

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';

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
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
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
