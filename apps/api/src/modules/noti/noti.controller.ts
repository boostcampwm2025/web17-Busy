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
import { NotiResponseDto } from '@repo/dto';
@Controller('noti')
export class NotiController {
  constructor(private readonly notiService: NotiService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getNotis(@UserId() userId: string): Promise<NotiResponseDto[]> {
    return await this.notiService.getNotisByUserId(userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async readNoti(@UserId() userId: string, @Param('id') notiId: string) {
    await this.notiService.readNoti(userId, notiId);
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@UserId() userId: string, @Param('id') notiId: string) {
    await this.notiService.deleteNoti(userId, notiId);
    return { ok: true };
  }
}
