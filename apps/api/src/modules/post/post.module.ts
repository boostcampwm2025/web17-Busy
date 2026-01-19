import { extname } from 'path';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { Like } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostMusic } from './entities/post-music.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { FeedService } from './feed.service';
import { PostRepository } from './post.repository';
import { PostMusicRepository } from './post-music.repository';

import { MusicModule } from '../music/music.module';
import { UploadModule } from '../upload/upload.module';
import { UploadService } from '../upload/upload.service';

@Module({
  imports: [
    MusicModule,
    UploadModule,
    TypeOrmModule.forFeature([Post, PostMusic, Like]),

    MulterModule.registerAsync({
      imports: [UploadModule],
      inject: [UploadService],
      useFactory: (upload: UploadService) => ({
        storage: diskStorage({
          destination: upload.uploadRoot,
          filename: (req, file, cb) => {
            const ext = extname(file.originalname);
            const safeName = `${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}${ext}`;
            cb(null, safeName);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.startsWith('image/')) return cb(null, false);
          cb(null, true);
        },
      }),
    }),
  ],
  controllers: [PostController],
  exports: [PostRepository],
  providers: [PostService, PostRepository, FeedService, PostMusicRepository],
})
export class PostModule {}
