import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LikeRepository } from './like.repository';
import { PostRepository } from '../post/post.repository';
import { CreateLikeDto, LikedUserDto, NotiType } from '@repo/dto';
import { NotiService } from '../noti/noti.service';

@Injectable()
export class LikeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly likeRepository: LikeRepository,
    private readonly postRepository: PostRepository,
    private readonly notiService: NotiService,
  ) {}

  // 좋아요 생성
  async addLike(userId: string, createLikeDto: CreateLikeDto) {
    const { postId } = createLikeDto;

    const txResult = await this.dataSource.transaction(async (manager) => {
      // 좋아요 존재 여부 확인
      const isLiked = await this.likeRepository.checkIsLiked(userId, postId);
      if (isLiked) {
        throw new ConflictException('이미 좋아요를 누른 게시물입니다.');
      }

      try {
        await this.likeRepository.createLike(manager, userId, postId);
        await this.postRepository.incrementLikeCount(postId, manager);
      } catch (error) {
        if (error.code === '23505') {
          throw new ConflictException('이미 좋아요를 누른 게시물입니다.');
        }
        throw new InternalServerErrorException('좋아요 처리에 실패했습니다.');
      }

      return { message: '좋아요 성공', postId };
    });

    // 알림 생성은 await 안 함 (실패해도 좋아요 기능은 성공해야 함)
    void this.notiService
      .create({
        type: NotiType.LIKE,
        actorId: userId,
        relatedId: postId,
      })
      .catch(() => {});

    return txResult;
  }

  // 좋아요 취소
  async removeLike(userId: string, postId: string) {
    return this.dataSource.transaction(async (manager) => {
      const isDeleted = await this.likeRepository.deleteLike(
        manager,
        userId,
        postId,
      );

      if (!isDeleted) {
        throw new NotFoundException(
          '좋아요 정보가 없거나 이미 취소되었습니다.',
        );
      }

      await this.postRepository.decrementLikeCount(postId, manager);

      return { message: '좋아요 취소 성공', postId };
    });
  }

  // 좋아요 누른 유저 목록 조회
  async getLikedUsers(postId: string): Promise<LikedUserDto[]> {
    const likes = await this.likeRepository.findLikedUsersByPostId(postId);

    // DTO 형태에 맞춰서 변환
    return likes.map((like) => ({
      id: like.user.id,
      nickname: like.user.nickname,
      profileImgUrl: like.user.profileImgUrl,
    }));
  }
}
