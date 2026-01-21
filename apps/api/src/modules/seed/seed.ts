import { NotiType, MusicProvider } from '@repo/dto';
import { DeepPartial } from 'typeorm';
import { Music } from '../music/entities/music.entity';
import { Post } from '../post/entities/post.entity';
import { PostMusic } from '../post/entities/post-music.entity';

const user1Id = '019be163-4b37-76ad-aeb3-6986a3489de6';
const user2Id = '019be163-4b3a-7619-a3cd-75302c5451e6';
const music1Id = '019be163-4b3a-7619-a3cd-79c79137c492';
const music2Id = '019be163-4b3a-7619-a3cd-7c0e99343f7a';
const music3Id = '019be163-4b3a-7619-a3cd-87ef10b78c42';
const music4Id = '019be165-248a-746b-b9c1-762e7a76f52d';
const music5Id = '019be165-248b-74bd-a6a5-87a65385ea36';
const music6Id = '019be165-6364-75ba-88a6-6e4331ec10fb';
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
    id: '019be164-4557-709c-ab9f-71e6e6d96f3b',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.COMMENT,
    relatedId: post1Id,
    isRead: false,
  },
  {
    id: '019be164-455b-7534-a069-6ceba98b8c3a',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.LIKE,
    relatedId: post2Id,
    isRead: false,
  },
  {
    id: '019be164-7026-7580-8af6-533852ded1de',
    receiver: { id: RECEIVER_ID },
    actor: { id: ACTOR_ID },
    type: NotiType.FOLLOW,
    isRead: true,
  },
  {
    id: '019be164-8fc3-7087-8a6b-ea63b85bc8c8',
    receiver: { id: ACTOR_ID },
    actor: { id: RECEIVER_ID },
    type: NotiType.FOLLOW,
    isRead: false,
  },
];

export const SEED_MUSICS: DeepPartial<Music>[] = [
  {
    id: music1Id,
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
    id: music2Id,
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
    id: music3Id,
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
    id: music4Id,
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
    id: music5Id,
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
    id: music6Id,
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

const pm1Id = '019be167-13a7-77e1-bbc7-d019dce35ba0';
const pm2Id = '019be169-d510-737c-9ede-24fcf0243f68';
const pm3Id = '019be167-4952-714b-95c7-61999ca1c990';
const pm4Id = '019be167-4953-740b-ad26-ccdb7bc00e1b';
const pm5Id = '019be167-70e1-751a-84b5-39a8dd3ccf21';

export const SEED_POST_MUSICS: DeepPartial<PostMusic>[] = [
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
  {
    id: pm4Id,
    post: { id: post1Id } as DeepPartial<Post>,
    music: { id: SEED_MUSICS[0].id } as DeepPartial<Music>,
    orderIndex: 0,
  },
  {
    id: pm5Id,
    post: { id: post1Id } as DeepPartial<Post>,
    music: { id: SEED_MUSICS[2].id } as DeepPartial<Music>,
    orderIndex: 1,
  },
];

export const SEED_LIKES = [
  { userId: user2Id, postId: post2Id },
  { userId: user1Id, postId: post3Id },
];

export const SEED_PLAYLISTS = [
  {
    id: '019be167-a8ad-7726-974f-7163392a054f',
    owner: { id: user1Id },
    title: '첫번째 플리',
  },
  {
    id: '019be167-a8ae-7178-8817-9981c912bbbb',
    owner: { id: user1Id },
    title: '두번째 플리',
  },
];

export const SEED_PLAYLIST_MUSICS = [
  {
    id: '019be169-4f7a-7339-afcb-5a7dcd553d19',
    playlist: { id: SEED_PLAYLISTS[0].id },
    music: { id: music2Id },
    orderIndex: 0,
  },
  {
    id: '019be169-4f7e-746c-ae3d-2d814eaa59bb',
    playlist: { id: SEED_PLAYLISTS[0].id },
    music: { id: music5Id },
    orderIndex: 1,
  },
  {
    id: '019be169-80e8-7568-8c24-8520c54b7e6b',
    playlist: { id: SEED_PLAYLISTS[0].id },
    music: { id: music1Id },
    orderIndex: 2,
  },
  {
    id: '019be169-4f7e-746c-ae3d-314c3d99bf5f',
    playlist: { id: SEED_PLAYLISTS[0].id },
    music: { id: music6Id },
    orderIndex: 3,
  },

  {
    id: '019be169-c254-70db-ae7f-361ef3a7c592',
    playlist: { id: SEED_PLAYLISTS[1].id },
    music: { id: music6Id },
    orderIndex: 0,
  },
  {
    id: '019be169-d510-737c-9ede-38267ddeeb1b',
    playlist: { id: SEED_PLAYLISTS[1].id },
    music: { id: music1Id },
    orderIndex: 1,
  },
];
