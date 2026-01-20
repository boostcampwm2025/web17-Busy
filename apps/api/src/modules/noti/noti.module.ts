import { Module } from '@nestjs/common';
import { NotiController } from './noti.controller';
import { NotiService } from './noti.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';
import { Post } from '../post/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Noti, Post])],
  controllers: [NotiController],
  providers: [NotiService],
  exports: [NotiService],
})
export class NotiModule {}
