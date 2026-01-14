import {
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
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
    try {
      return await this.notiService.getNotisByUserId(userId);
    } catch (error) {
      throw new InternalServerErrorException(
        `알림을 읽어오는 데 실패했습니다. 에러메시지: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async readNoti(@UserId() userId: string, @Param('id') notiId: string) {
    try {
      await this.notiService.readNoti(userId, notiId);
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `알림 수정에 실패했습니다. 에러메시지: ${error.message}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@UserId() userId: string, @Param('id') notiId: string) {
    try {
      await this.notiService.deleteNoti(userId, notiId);
      return { ok: true };
    } catch (error) {
      throw new InternalServerErrorException(
        `알림을 삭제하는 데 실패했습니다. 에러메시지: ${error.message}`,
      );
    }
  }
}
