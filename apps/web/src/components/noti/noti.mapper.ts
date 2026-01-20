import { NotiRelatedType, NotiResponseDto } from '@repo/dto';
import { NotiView } from './noti.types';
import { formatRelativeTime, coalesceImageSrc } from '@/utils';
import { DEFAULT_IMAGES } from '@/constants';

function toNotiMessageBody(n: NotiResponseDto) {
  switch (n.type) {
    case 'comment':
      return `님이 회원님의 게시글에 댓글을 남겼습니다.`;
    case 'like':
      return `님이 회원님의 게시글에 좋아요를 눌렀습니다.`;
    case 'follow':
      return `님이 회원님을 팔로우했습니다.`;
    default:
      return `님의 알림이 도착했습니다.`;
  }
}

export function toNotiView(n: NotiResponseDto): NotiView {
  return {
    id: n.id,
    isRead: n.isRead,

    createdAtIso: n.createdAt,
    createdAtText: formatRelativeTime(n.createdAt),

    actorUserId: n.actor.id,
    actorNickname: n.actor.nickname,
    actorProfileImgUrl: coalesceImageSrc(n.actor.profileImgUrl, DEFAULT_IMAGES.PROFILE),

    messageBody: toNotiMessageBody(n),

    thumbnailUrl: n.thumbnailUrl?.trim() || (n.relatedType === NotiRelatedType.USER ? DEFAULT_IMAGES.PROFILE : DEFAULT_IMAGES.POST),
    thumbnailShape: n.thumbnailShape,

    relatedId: n.relatedId,
    relatedType: n.relatedType,
  };
}
