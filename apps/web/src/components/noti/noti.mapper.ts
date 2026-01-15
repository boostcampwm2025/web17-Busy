import { NotiResponseDto } from '@repo/dto';
import { NotiView } from './noti.types';
import { formatRelativeTime } from '@/utils';

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
    id: n.notiId,
    isRead: n.isRead,

    createdAtIso: n.createdAt,
    createdAtText: formatRelativeTime(n.createdAt),

    actorNickname: n.actor.nickname,
    messageBody: toNotiMessageBody(n),

    thumbnailUrl: n.thumbnailUrl,
    thumbnailShape: n.thumbnailShape,

    relatedId: n.relatedId,
    relatedType: n.relatedType,
  };
}
