import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { NotiService } from './noti.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserId } from 'src/common/decorators/userId.decorator';

@Controller('noti')
export class NotiController {
  constructor(private readonly notiService: NotiService) {}

  @UseGuards(AuthGuard)
  @Get()
  getNotis(@UserId() userId: string) {}

  @UseGuards(AuthGuard)
  @Patch(':id')
  readNoti(@UserId() userId: string, @Param('id') notiId: string) {}

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@UserId() userId: string, @Param('id') notiId: string) {}
}
