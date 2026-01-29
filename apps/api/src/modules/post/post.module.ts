import { Module, BadRequestException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { Like } from '../like/entities/like.entity';
import { Post } from './entities/post.entity';
import { PostMusic } from './entities/post-music.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { PostMusicRepository } from './post-music.repository';

import { MusicModule } from '../music/music.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MusicModule,
    UploadModule,
    TypeOrmModule.forFeature([Post, PostMusic, Like]),

    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('이미지 파일만 업로드 가능합니다.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [PostController],
  exports: [PostRepository],
  providers: [PostService, PostRepository, PostMusicRepository],
})
export class PostModule {}
