import { Controller } from '@nestjs/common';
import { NotiService } from './index';

@Controller('notification')
export class NotiController {
  constructor(private readonly notiService: NotiService) {}
}
