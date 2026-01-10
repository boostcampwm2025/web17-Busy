import { Controller } from '@nestjs/common';
import { NotiService } from './noti.service';

@Controller('notification')
export class NotiController {
  constructor(private readonly notiService: NotiService) {}
}
