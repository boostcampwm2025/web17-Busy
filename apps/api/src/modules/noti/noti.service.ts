import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';
import { Repository } from 'typeorm';
import { NotiResponseDto } from '@repo/dto/noti/res/notiResponseDto';
import { Post } from '../post/entities/post.entity';
import { NotiType } from 'src/common/constants';

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

  private async toNotiResponseDto(noti: Noti): Promise<NotiResponseDto> {
    // imgUrl
    // follow - actor의 profileImgUrl
    // like, comment - post의 thumbnailImgUrl
    let imgUrl: string;
    if (noti.type === NotiType.FOLLOW) {
      imgUrl = noti.actor.profileImgUrl;
    } else {
      const post = await this.postRepo.findOne({
        where: { id: noti.relatedId },
        select: { thumbnailImgUrl: true },
      });

      imgUrl = post?.thumbnailImgUrl ?? '';
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
      imgUrl,
    };
  }
}
