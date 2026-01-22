import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Noti } from './entities/noti.entity';
import { Repository } from 'typeorm';
import {
  NotiRelatedType,
  NotiResponseDto,
  NotiThumbnailShapeType,
  NotiType,
} from '@repo/dto';
import { Post } from '../post/entities/post.entity';

type CreateCommentNoti = {
  type: NotiType.COMMENT;
  actorId: string;
  relatedId: string;
};

type CreateLikeNoti = {
  type: NotiType.LIKE;
  actorId: string;
  relatedId: string;
};

type CreateFollowNoti = {
  type: NotiType.FOLLOW;
  receiverId: string;
  actorId: string;
};

type CreateNotiType = CreateCommentNoti | CreateLikeNoti | CreateFollowNoti;

@Injectable()
export class NotiService {
  constructor(
    @InjectRepository(Noti)
    private readonly notiRepo: Repository<Noti>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async create(createNoti: CreateNotiType) {
    if (createNoti.type === NotiType.FOLLOW) {
      return await this.createFollowNoti(createNoti);
    }

    // author relation을 안전하게 로딩(최소 필드)
    const post = await this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select(['post.id', 'author.id'])
      .where('post.id = :id', { id: createNoti.relatedId })
      .getOne();

    const receiverId = post?.author?.id;
    if (!receiverId)
      throw new BadRequestException('게시글이 존재하지 않습니다.');

    // 자기 자신에게는 알림 생성하지 않음(정책)
    if (receiverId === createNoti.actorId) return;

    return await this.createLikeOrCommentNoti({
      ...createNoti,
      receiverId,
    });
  }

  private async createFollowNoti({
    receiverId,
    actorId,
  }: {
    receiverId: string;
    actorId: string;
  }) {
    const noti = this.notiRepo.create({
      receiver: { id: receiverId },
      actor: { id: actorId },
      type: NotiType.FOLLOW,
      isRead: false,
    });

    return await this.notiRepo.save(noti);
  }

  private async createLikeOrCommentNoti({
    receiverId,
    actorId,
    type,
    relatedId,
  }: {
    receiverId: string;
    actorId: string;
    type: NotiType;
    relatedId: string;
  }) {
    const noti = this.notiRepo.create({
      receiver: { id: receiverId },
      actor: { id: actorId },
      type,
      relatedId,
      isRead: false, // 추가해야 오류가 안 나옵니다.
    });

    return await this.notiRepo.save(noti);
  }

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
    // imgUrl - related의 img 없으면 null
    // like, comment - related: post
    let relatedType: NotiRelatedType;
    let thumbnailUrl: string;
    let thumbnailShape: NotiThumbnailShapeType;

    if (noti.type === NotiType.LIKE || noti.type === NotiType.COMMENT) {
      const post = await this.postRepo.findOne({
        where: { id: noti.relatedId },
        select: { coverImgUrl: true },
      });

      relatedType = NotiRelatedType.POST;
      thumbnailUrl = post?.coverImgUrl ?? '';
      thumbnailShape = NotiThumbnailShapeType.SQUARE;
    } else {
      relatedType = NotiRelatedType.USER;
      thumbnailUrl = noti.actor.profileImgUrl;
      thumbnailShape = NotiThumbnailShapeType.CIRCLE;
    }

    return {
      id: noti.id,
      actor: {
        id: noti.actor.id,
        nickname: noti.actor.nickname,
        profileImgUrl: noti.actor.profileImgUrl,
      },
      type: noti.type as NotiType,
      relatedId: noti.relatedId ?? noti.actor.id,
      relatedType,
      isRead: noti.isRead,
      createdAt: noti.createdAt.toISOString(),
      thumbnailUrl,
      thumbnailShape,
    };
  }
}
