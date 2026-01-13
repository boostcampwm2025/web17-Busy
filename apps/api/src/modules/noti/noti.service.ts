import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';
import { Repository } from 'typeorm';
import { NotiResponseDto } from '@repo/dto/noti/res/notiResponseDto';

@Injectable()
export class NotiService {
  constructor(
    @InjectRepository(Noti)
    private readonly notiRepo: Repository<Noti>,
  ) {}

  async getNotisByUserId(userId: string): Promise<NotiResponseDto[]> {
    const notis = await this.notiRepo.find({
      where: { receiver: { id: userId } },
      relations: { actor: true },
    });

    return notis.map((n) => this.toNotiResponseDto(n));
  }

  async readNoti(userId: string, notiId: string): Promise<void> {
    await this.notiRepo.update(
      {
        id: notiId,
        receiver: { id: userId },
      },
      { isRead: true },
    );
  }

  async deleteNoti(userId: string, notiId: string): Promise<void> {
    await this.notiRepo.delete({
      id: notiId,
      receiver: { id: userId },
    });
  }

  private toNotiResponseDto(noti: Noti): NotiResponseDto {}
}
