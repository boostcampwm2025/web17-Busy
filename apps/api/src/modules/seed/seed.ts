import { NotiType, MusicProvider } from '@repo/dto';
import { DeepPartial } from 'typeorm';
import { Music } from '../music/entities/music.entity';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';

const user1Id = '11111111-1111-1111-1111-111111111111';
const user2Id = '22222222-2222-2222-2222-222222222222';
const music1Id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const music2Id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const music3Id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const post1Id = '018f3b7a-b8f1-74ab-a6e2-3d9c0f1b8e45';
const post2Id = '018f3b7a-a2d4-7f09-9c31-1e8b7a5d4c22';
const post3Id = '018f3b7a-9c6e-7c21-8b4f-6a2d5e3c9f10';

export const SEED_USERS = [
  {
    id: user1Id,
    nickname: '테스트 사용자 1',
    email: 'example111@naver.com',
    profileImgUrl:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128',
    bio: '하이요~~',
  },
  {
    id: user2Id,
    nickname: '테스트 사용자 2',
    email: 'example222@naver.com',
    profileImgUrl:
      'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&f=y&s=128',
    bio: '하이요~~',
  },
];

const RECEIVER_ID = user1Id;
const ACTOR_ID = user2Id;

export const SEED_NOTIS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.COMMENT,
    relatedId: post1Id,
    isRead: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.LIKE,
    relatedId: post2Id,
    isRead: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.FOLLOW,
    isRead: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    receiver: { id: ACTOR_ID },
    actor: { id: RECEIVER_ID },
    type: NotiType.FOLLOW,
    isRead: false,
  },
];

export const SEED_MUSICS: DeepPartial<Music>[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'we cant be friends',
    artistName: 'Ariana Grande',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/2e/88/88/2e8888ad-a0cf-eece-70a7-1ff81377a3ab/24UMGIM00198.rgb.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/22/fc/88/22fc885b-27c8-4693-7400-9e774eae9d7a/mzaf_5140833304960295464.plus.aac.p.m4a',
    provider: MusicProvider.APPLE,
    durationMs: 30000,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Die For You',
    artistName: 'The Weekend',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/de/52/1d/de521dd3-f0f5-b694-4f30-3d465cc5bd0b/mzaf_9744418488383113655.plus.aac.p.m4a',
    provider: MusicProvider.APPLE,
    durationMs: 30000,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Ditto',
    artistName: 'NewJeans',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f6/29/42/f629426e-92fe-535c-cbe4-76e70850819b/196922287107_Cover.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/67/af/3d/67af3de7-8967-bc14-073d-a8712338ac32/mzaf_190692881480987912.plus.aac.p.m4a',
    provider: MusicProvider.APPLE,
    durationMs: 30000,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/9a/fa/45/9afa45ec-7823-7e58-5580-27c01cdd709d/akmu_cover.jpg/600x600bb.jpg',
    artistName: '악뮤',
    durationMs: 283800,
    provider: MusicProvider.ITUNES,
    title: '오랜 날 오랜 밤',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/57/b1/84/57b184a7-a483-be7a-7aa8-0f1290d0258b/mzaf_394777065639841416.plus.aac.p.m4a',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7f/ca/13/7fca1315-9134-7937-b159-367bbed08dfa/AKMU_LoveLee_Cover_4000x4000.jpg/600x600bb.jpg',
    artistName: '악뮤',
    durationMs: 204577,
    provider: MusicProvider.ITUNES,
    title: '후라이의 꿈',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/05/5f/72/055f725b-623b-073e-cadb-04c88eea2f3e/mzaf_4121315245673499980.plus.aac.p.m4a',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/12/31/63/12316366-55bb-065c-8ad9-47e107fa79b2/AKMU_NEXT_EPISODE.jpg/600x600bb.jpg',
    artistName: '악뮤',
    durationMs: 212808,
    provider: MusicProvider.ITUNES,
    title: '낙하 (with 아이유)',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/86/4d/a5/864da591-eeb0-27db-bbfa-a190ee20a05c/mzaf_17780542814473670833.plus.aac.p.m4a',
  },
];

export const SEED_POSTS: DeepPartial<Post>[] = [
  {
    id: post1Id, // noti.relatedId
    author: { id: user1Id },
    coverImgUrl: SEED_MUSICS[0].albumCoverUrl!, // 커버 이미지: music 1 앨범커버
    content: '요즘 이 곡 진짜 반복재생 중… 분위기 미쳤다. 너네도 들어봐.',
    likeCount: 1,
    commentCount: 1,
  },
  {
    id: post2Id,
    author: { id: user1Id },
    coverImgUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/9a/fa/45/9afa45ec-7823-7e58-5580-27c01cdd709d/akmu_cover.jpg/600x600bb.jpg',
    content: 'AKMU 노래 모음',
    likeCount: 1,
    commentCount: 0,
  },
  {
    id: post3Id,
    author: { id: user2Id },
    coverImgUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/12/31/63/12316366-55bb-065c-8ad9-47e107fa79b2/AKMU_NEXT_EPISODE.jpg/600x600bb.jpg',
    content: 'AKMU 노래 추천',
    likeCount: 1,
    commentCount: 0,
  },
];

const pm1Id = '55555555-5555-5555-5555-555555555555';
const pm2Id = '66666666-6666-6666-6666-666666666666';
const pm3Id = '77777777-7777-7777-7777-777777777777';

export const SEED_POST_MUSICS: DeepPartial<PostMusic>[] = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    post: { id: post1Id } as DeepPartial<Post>,
    music: { id: SEED_MUSICS[0].id } as DeepPartial<Music>,
    orderIndex: 0,
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    post: { id: post1Id } as DeepPartial<Post>,
    music: { id: SEED_MUSICS[2].id } as DeepPartial<Music>,
    orderIndex: 1,
  },
  {
    id: pm1Id,
    post: { id: post2Id },
    music: { id: music1Id },
    orderIndex: 0,
  },
  {
    id: pm2Id,
    post: { id: post2Id },
    music: { id: music2Id },
    orderIndex: 1,
  },

  {
    id: pm3Id,
    post: { id: post3Id },
    music: { id: music3Id },
    orderIndex: 0,
  },
];

export const SEED_LIKES = [
  { userId: user2Id, postId: post2Id },
  { userId: user1Id, postId: post3Id },
];

export const SEED_PLAYLISTS = [
  {
    id: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
    owner: { id: '11111111-1111-1111-1111-111111111111' },
    title: '첫번째 플리',
  },
  {
    id: 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq',
    owner: { id: '11111111-1111-1111-1111-111111111111' },
    title: '두번째 플리',
  },
];

export const SEED_PLAYLIST_MUSICS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    playlist: { id: 'pppppppp-pppp-pppp-pppp-pppppppppppp' },
    music: { id: '11111111-1111-1111-1111-111111111111' },
    orderIndex: 0,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    playlist: { id: 'pppppppp-pppp-pppp-pppp-pppppppppppp' },
    music: { id: '22222222-2222-2222-2222-222222222222' },
    orderIndex: 1,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    playlist: { id: 'pppppppp-pppp-pppp-pppp-pppppppppppp' },
    music: { id: '33333333-3333-3333-3333-333333333333' },
    orderIndex: 2,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    playlist: { id: 'pppppppp-pppp-pppp-pppp-pppppppppppp' },
    music: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    orderIndex: 3,
  },

  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    playlist: { id: 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq' },
    music: { id: '11111111-1111-1111-1111-111111111111' },
    orderIndex: 0,
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    playlist: { id: 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq' },
    music: { id: '11111111-1111-1111-1111-111111111111' },
    orderIndex: 1,
  },
];
