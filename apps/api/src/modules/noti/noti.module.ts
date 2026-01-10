import { Module } from '@nestjs/common';
import { NotiController } from './noti.controller';
import { NotiService } from './noti.service';

@Module({
  imports: [],
  controllers: [NotiController],
  providers: [NotiService],
})
export class NotiModule {}
