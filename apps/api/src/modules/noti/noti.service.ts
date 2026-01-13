import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotiService {
  constructor(
    @InjectRepository(Noti)
    private readonly notiRepo: Repository<Noti>,
  ) {}
}
