import { NotiResponseDto } from '@repo/dto';
import { NotiView } from './noti.types';

function formatKoreanTime(iso: string) {
  // 일단 단순 표시 (원하면 “n분 전”으로 바꿔줄게)
  return new Date(iso).toLocaleString('ko-KR', { hour12: false });
}

function toNotiMessage(n: NotiResponseDto) {
  const name = n.actor.nickname;

  switch (n.type) {
    case 'comment':
      return `${name}님이 댓글을 남겼어.`;
    case 'like':
      return `${name}님이 좋아요를 눌렀어.`;
    case 'follow':
      return `${name}님이 팔로우했어.`;
    default:
      return `${name}님의 알림이 도착했어.`;
  }
}

export function toNotiView(n: NotiResponseDto): NotiView {
  return {
    id: n.notiId,
    isRead: n.isRead,
    createdAtText: formatKoreanTime(n.createdAt as unknown as string), // 백에서 Date로 내려줘도 실제론 string일 확률 높음
    message: toNotiMessage(n),
    avatarUrl: n.actor.profileImgUrl ?? null,
    targetImgUrl: n.imgUrl && n.imgUrl.length > 0 ? n.imgUrl : null,
    kind: 'user',
  };
}
