import { Provider } from '@repo/dto';
import { NotiType } from 'src/common/constants';
import { DeepPartial } from 'typeorm';
import { Music } from '../music/entities/music.entity';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';

export const SEED_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nickname: '테스트 사용자 1',
    email: 'example111@naver.com',
    profileImageUrl: '사용자 1의 프로필',
    bio: '하이요~~',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nickname: '테스트 사용자 2',
    email: 'example222@naver.com',
    profileImageUrl: '사용자 2의 프로필',
    bio: '하이요~~',
  },
];

const RECEIVER_ID = '11111111-1111-1111-1111-111111111111';
const ACTOR_ID = '22222222-2222-2222-2222-222222222222';

export const SEED_NOTIS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.COMMENT,
    relatedId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    isRead: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.LIKE,
    relatedId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
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
    provider: Provider.APPLE,
    durationMs: 300,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Die For You',
    artistName: 'The Weekend',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/de/52/1d/de521dd3-f0f5-b694-4f30-3d465cc5bd0b/mzaf_9744418488383113655.plus.aac.p.m4a',
    provider: Provider.APPLE,
    durationMs: 300,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Ditto',
    artistName: 'NewJeans',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f6/29/42/f629426e-92fe-535c-cbe4-76e70850819b/196922287107_Cover.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/67/af/3d/67af3de7-8967-bc14-073d-a8712338ac32/mzaf_190692881480987912.plus.aac.p.m4a',
    provider: Provider.APPLE,
    durationMs: 300,
  },
];

export const SEED_POSTS: DeepPartial<Post>[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // noti.relatedId
    author: { id: SEED_USERS[0].id },
    thumbnailImgUrl: SEED_MUSICS[0].albumCoverUrl!, // 커버 이미지: music 1 앨범커버
    content: '요즘 이 곡 진짜 반복재생 중… 분위기 미쳤다. 너네도 들어봐.',
    likeCount: 1,
    commentCount: 1,
  },
];

// post-music 매핑 (이 게시글에 음악 2개 연결)
export const SEED_POST_MUSICS: DeepPartial<PostMusic>[] = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    post: { id: SEED_POSTS[0].id } as DeepPartial<Post>,
    music: { id: SEED_MUSICS[0].id } as DeepPartial<Music>,
    orderIndex: 0,
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    post: { id: SEED_POSTS[0].id } as DeepPartial<Post>,
    music: { id: SEED_MUSICS[2].id } as DeepPartial<Music>,
    orderIndex: 1,
  },
];
