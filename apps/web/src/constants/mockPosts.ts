import { MusicProvider, MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

const now = Date.now();
const minutes = (n: number) => n * 60 * 1000;
const hours = (n: number) => n * 60 * 60 * 1000;
const days = (n: number) => n * 24 * 60 * 60 * 1000;

const isoAgo = (msAgo: number) => new Date(now - msAgo).toISOString();

const MOCK_MUSICS: Music[] = [
  {
    id: 'm-1',
    provider: MusicProvider.ITUNES,
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/7d/ed/d6/7dedd634-2bdd-b55f-8529-6b906df37f5e/mzaf_9292972481722090940.plus.aac.p.m4a',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/36/89/c9/3689c99a-f88e-d019-b7b2-83a3eb8a379b/4897028491172_Cover.jpg/600x600bb.jpg',
    title: 'Midnight City',
    artistName: 'VIBR Artist',
    durationMs: 210_000,
  },
  {
    id: 'm-2',
    provider: MusicProvider.ITUNES,
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4d/79/29/4d79296f-7eae-383d-2885-facc9da46c8c/mzaf_12023052104897000510.plus.aac.p.m4a',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/03/4d/0a/034d0a44-d7d8-9aa8-a58c-5e5b9b3ccd2c/ANTCD-A0000012700.jpg/600x600bb.jpg',
    title: 'City Lights',
    artistName: 'VIBR Artist',
    durationMs: 222_000,
  },
  {
    id: 'm-3',
    provider: MusicProvider.ITUNES,
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/0c/ad/28/0cad2809-7456-f1a0-bb73-229f5ca53961/mzaf_15626393563602953255.plus.aac.p.m4a',
    albumCoverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/73/d6/b5/73d6b59d-aa86-e8c9-1c3a-c011ac57f306/artwork.jpg/600x600bb.jpg',
    title: 'Neon Dreams',
    artistName: 'VIBR Artist',
    durationMs: 198_000,
  },
  {
    id: 'm-4',
    provider: MusicProvider.ITUNES,
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c1/d8/4e/c1d84e03-66fb-3a0f-d0a0-46108a235702/mzaf_3033050337908928626.plus.aac.p.m4a',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1e/90/d2/1e90d2f1-b833-f236-ec7b-107edd0350ac/coffee-break.jpg/600x600bb.jpg',
    title: 'Coffee Break',
    artistName: 'VIBR Artist',
    durationMs: 185_000,
  },
  {
    id: 'm-5',
    provider: MusicProvider.ITUNES,
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/14/d7/2b/14d72b82-b397-7b4b-2922-116d2c6d2a8c/mzaf_2737461626288763697.plus.aac.p.m4a',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/72/29/d9/7229d9e9-f620-f800-cec5-e2a554ebe9ba/4550752377807_cover.png/600x600bb.jpg',
    title: 'Rainy Day',
    artistName: 'VIBR Artist',
    durationMs: 201_000,
  },
];

const USER_1 = {
  id: 'u-1',
  nickname: '김예빈',
  profileImgUrl: 'https://picsum.photos/seed/user-1/100/100',
};

const USER_2 = {
  id: 'u-2',
  nickname: '김승호',
  profileImgUrl: 'https://picsum.photos/seed/user-2/100/100',
};

const USER_3 = {
  id: 'u-3',
  nickname: '문예찬',
  profileImgUrl: 'https://picsum.photos/seed/user-3/100/100',
};

export const MOCK_POSTS: Post[] = [
  {
    id: 'p-1',
    author: USER_1,
    coverImgUrl: MOCK_MUSICS[0]!.albumCoverUrl,
    content: '요즘 밤에 듣기 딱 좋은 곡. 분위기 미쳤음.',
    likeCount: 124,
    commentCount: 12,
    createdAt: isoAgo(minutes(12)), // 12분 전
    musics: [MOCK_MUSICS[0]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-2',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[1]!.albumCoverUrl,
    content: '드라이브할 때 꼭 듣는 곡들 모아봤어.',
    likeCount: 89,
    commentCount: 5,
    createdAt: isoAgo(hours(3) + minutes(20)), // 3시간 20분 전
    musics: [MOCK_MUSICS[1]!, MOCK_MUSICS[2]!], // 다곡
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-3',
    author: USER_3,
    coverImgUrl: MOCK_MUSICS[2]!.albumCoverUrl,
    content: '작업할 때 듣기 좋은 노동요 추천.',
    likeCount: 245,
    commentCount: 34,
    createdAt: isoAgo(days(1) + hours(2)), // 1일 2시간 전
    musics: [MOCK_MUSICS[2]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-4',
    author: USER_1,
    coverImgUrl: MOCK_MUSICS[3]!.albumCoverUrl,
    content: '카페에서 듣기 좋은 재즈 감성.',
    likeCount: 56,
    commentCount: 8,
    createdAt: isoAgo(days(3) + hours(5)), // 3일 5시간 전
    musics: [MOCK_MUSICS[3]!, MOCK_MUSICS[4]!, MOCK_MUSICS[1]!], // 다곡
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-5',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-6',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-7',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-8',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-9',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
    isLiked: false,
    isEdited: false,
  },
  {
    id: 'p-10',
    author: USER_2,
    coverImgUrl: MOCK_MUSICS[4]!.albumCoverUrl,
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    createdAt: isoAgo(days(7)), // 7일 전
    musics: [MOCK_MUSICS[4]!],
    isLiked: false,
    isEdited: false,
  },
];
