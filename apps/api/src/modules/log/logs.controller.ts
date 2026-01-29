import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateLogsReqDto, CreateLogsResDto } from '@repo/dto';

import { AuthOptionalGuard } from 'src/common/guards/auth.optional-guard';
import { UserId } from 'src/common/decorators/userId.decorator';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  @UseGuards(AuthOptionalGuard)
  async create(
    @UserId() userId: string | null,
    @Body() dto: CreateLogsReqDto,
  ): Promise<CreateLogsResDto> {
    const accepted = await this.logsService.ingest(userId, dto);
    return { ok: true, accepted };
  }
}
