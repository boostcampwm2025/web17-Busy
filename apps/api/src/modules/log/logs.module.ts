import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogEvent } from './entities/log-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogEvent])],
  controllers: [LogsController],
  providers: [LogsService],
})
export class LogsModule {}
