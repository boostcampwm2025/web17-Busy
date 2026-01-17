import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';
import { Repository } from 'typeorm';
import { NotiResponseDto, NotiType } from '@repo/dto';
import { Post } from '../post/entities/post.entity';

@Injectable()
export class NotiService {
  constructor(
    @InjectRepository(Noti)
    private readonly notiRepo: Repository<Noti>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async getNotisByUserId(userId: string): Promise<NotiResponseDto[]> {
    const notis = await this.notiRepo.find({
      where: { receiver: { id: userId } },
      relations: { actor: true },
    });

    return await Promise.all(notis.map((n) => this.toNotiResponseDto(n)));
  }

  async readNoti(userId: string, notiId: string): Promise<void> {
    const noti = await this.notiRepo.findOne({
      where: { id: notiId },
      relations: { receiver: true },
      select: { id: true, isRead: true, receiver: { id: true } },
    });

    if (!noti) throw new NotFoundException('알림을 찾을 수 없습니다.');
    if (noti.receiver.id !== userId)
      throw new ForbiddenException('이 알림의 수신자가 아닙니다.');

    if (noti.isRead) return;
    await this.notiRepo.update({ id: notiId }, { isRead: true });
  }

  async deleteNoti(userId: string, notiId: string): Promise<void> {
    const noti = await this.notiRepo.findOne({
      where: { id: notiId },
      relations: { receiver: true },
      select: { id: true, receiver: { id: true } },
    });

    if (!noti) throw new NotFoundException('알림을 찾을 수 없습니다.');
    if (noti.receiver.id !== userId)
      throw new ForbiddenException('이 알림의 수신자가 아닙니다.');

    await this.notiRepo.delete({ id: notiId });
  }

  private async toNotiResponseDto(noti: Noti): Promise<NotiResponseDto> {
    // imgUrl
    // follow - actor의 profileImgUrl
    // like, comment - post의 coverImgUrl
    let imgUrl: string;
    if (noti.type === NotiType.FOLLOW) {
      imgUrl = noti.actor.profileImgUrl;
    } else {
      const post = await this.postRepo.findOne({
        where: { id: noti.relatedId },
        select: { coverImgUrl: true },
      });

      imgUrl = post?.coverImgUrl ?? '';
    }

    return {
      notiId: noti.id,
      actor: {
        userId: noti.actor.id,
        nickname: noti.actor.nickname,
        profileImgUrl: noti.actor.profileImgUrl,
      },
      type: noti.type,
      relatedId: noti.relatedId,
      isRead: noti.isRead,
      createdAt: noti.createdAt.toISOString(),
      imgUrl,
    };
  }
}
