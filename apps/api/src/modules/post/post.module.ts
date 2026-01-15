import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { FeedService } from './feed.service';
import { PostMusic } from './entities/post-music.entity';
import { PostMusicRepository } from './post-music.repository';
import { LikeModule } from '../like/like.module';
import { Post } from './entities/post.entity';
import { UploadModule } from '../upload/upload.module';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostMusic]),
    LikeModule,
    UploadModule,
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
