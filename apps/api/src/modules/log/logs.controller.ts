import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateLogsReqDto, CreateLogsResDto } from '@repo/dto';

import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @UseGuards(AuthGuard) // 로그인 전용
  async create(
    @UserId() userId: string, // null 아님
    @Body() dto: CreateLogsReqDto,
  ): Promise<CreateLogsResDto> {
    const accepted = await this.logsService.ingest(userId, dto);
    return { ok: true, accepted };
  }
}
