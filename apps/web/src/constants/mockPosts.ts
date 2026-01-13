import type { Post, Music } from '@/types';

const now = Date.now();
const minutes = (n: number) => n * 60 * 1000;
const hours = (n: number) => n * 60 * 60 * 1000;
const days = (n: number) => n * 24 * 60 * 60 * 1000;

const isoAgo = (msAgo: number) => new Date(now - msAgo).toISOString();

const MOCK_MUSICS: Music[] = [
  {
    musicId: 'm-1',
    provider: 'APPLE',
    trackUri: 'https://example.com/preview-1.m4a',
    albumCoverUrl: 'https://picsum.photos/seed/vibr-m1/600/600',
    title: 'Midnight City',
    artistName: 'VIBR Artist',
    durationMs: 210_000,
  },
  {
    musicId: 'm-2',
    provider: 'APPLE',
    trackUri: 'https://example.com/preview-2.m4a',
    albumCoverUrl: 'https://picsum.photos/seed/vibr-m2/600/600',
    title: 'City Lights',
    artistName: 'VIBR Artist',
    durationMs: 222_000,
  },
  {
    musicId: 'm-3',
    provider: 'APPLE',
    trackUri: 'https://example.com/preview-3.m4a',
    albumCoverUrl: 'https://picsum.photos/seed/vibr-m3/600/600',
    title: 'Neon Dreams',
    artistName: 'VIBR Artist',
    durationMs: 198_000,
  },
  {
    musicId: 'm-4',
    provider: 'APPLE',
    trackUri: 'https://example.com/preview-4.m4a',
    albumCoverUrl: 'https://picsum.photos/seed/vibr-m4/600/600',
    title: 'Coffee Break',
    artistName: 'VIBR Artist',
    durationMs: 185_000,
  },
  {
    musicId: 'm-5',
    provider: 'APPLE',
    trackUri: 'https://example.com/preview-5.m4a',
    albumCoverUrl: 'https://picsum.photos/seed/vibr-m5/600/600',
    title: 'Rainy Day',
    artistName: 'VIBR Artist',
    durationMs: 201_000,
  },
];

const USER_1 = {
  userId: 'u-1',
  nickname: '김예빈',
  profileImageUrl: 'https://picsum.photos/seed/user-1/100/100',
};

const USER_2 = {
  userId: 'u-2',
  nickname: '김승호',
  profileImageUrl: 'https://picsum.photos/seed/user-2/100/100',
};

const USER_3 = {
  userId: 'u-3',
  nickname: '문예찬',
  profileImageUrl: 'https://picsum.photos/seed/user-3/100/100',
};

export const MOCK_POSTS: Post[] = [
  {
    postId: 'p-1',
    author: USER_1,
    coverImgUrl: MOCK_MUSICS[0]!.albumCoverUrl,
    content: '요즘 밤에 듣기 딱 좋은 곡. 분위기 미쳤음.',
    likeCount: 124,
    commentCount: 12,
    createdAt: isoAgo(minutes(12)), // 12분 전
    musics: [MOCK_MUSICS[0]!],
  },
  {
    postId: 'p-2',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[1]!.albumCoverUrl,
    content: '드라이브할 때 꼭 듣는 곡들 모아봤어.',
    likeCount: 89,
    commentCount: 5,
    createdAt: isoAgo(hours(3) + minutes(20)), // 3시간 20분 전
    musics: [MOCK_MUSICS[1]!, MOCK_MUSICS[2]!], // 다곡
  },
  {
    postId: 'p-3',
    author: USER_3,
    coverImgUrl: MOCK_MUSICS[2]!.albumCoverUrl,
    content: '작업할 때 듣기 좋은 노동요 추천.',
    likeCount: 245,
    commentCount: 34,
    createdAt: isoAgo(days(1) + hours(2)), // 1일 2시간 전
    musics: [MOCK_MUSICS[2]!],
  },
  {
    postId: 'p-4',
    author: USER_1,
    coverImgUrl: MOCK_MUSICS[3]!.albumCoverUrl,
    content: '카페에서 듣기 좋은 재즈 감성.',
    likeCount: 56,
    commentCount: 8,
    createdAt: isoAgo(days(3) + hours(5)), // 3일 5시간 전
    musics: [MOCK_MUSICS[3]!, MOCK_MUSICS[4]!, MOCK_MUSICS[1]!], // 다곡
  },
  {
    postId: 'p-5',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
  },
];
