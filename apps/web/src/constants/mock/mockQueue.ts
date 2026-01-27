import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

export const MOCK_QUEUE: Music[] = [
  {
    id: '019bf9b0-3e11-72ab-96e4-1353dcfdf41c',
    albumCoverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8c/c1/c6/8cc1c6d0-4d01-c8e2-c9e1-a1ddb9c691d7/artwork.jpg/600x600bb.jpg',
    artistName: 'tomy wyne',
    durationMs: 30000,
    provider: MusicProvider.ITUNES,
    title: "I'm in Luck",
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/82/8a/35/828a3509-f8fc-46bf-1547-d3ae7313f524/mzaf_14494522885537502418.plus.aac.p.m4a',
  },
  {
    id: '임시 아이디 11111',
    albumCoverUrl: 'https://i.ytimg.com/vi/05BWsYqMiYE/hqdefault.jpg',
    artistName: 'Sultan Of The Disco',
    durationMs: 30000,
    provider: MusicProvider.YOUTUBE,
    title: '술탄오브더디스코 - Shining Road (official M/V)',
    trackUri: '05BWsYqMiYE',
  },
  {
    id: '019bf9b0-4cd3-7544-aef7-8deec62beac2',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/22/e8/d7/22e8d721-bb5e-5873-a422-4dcbc7cb19b2/888272171204_Cover.jpg/600x600bb.jpg',
    artistName: '헤이즈',
    durationMs: 30000,
    provider: MusicProvider.ITUNES,
    title: 'Love Virus (feat. I.M)',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/e1/9e/7c/e19e7c70-f10b-9365-e269-d781fbc1922d/mzaf_12795284643197837630.plus.aac.p.m4a',
  },
  {
    id: '임시 아이디 22222',
    albumCoverUrl: 'https://i.ytimg.com/vi/5tTbEXp6eWs/hqdefault.jpg',
    artistName: 'Guitarnet',
    durationMs: 30000,
    provider: MusicProvider.YOUTUBE,
    title: 'Su-Young Kim (김수영) | Wave | Fender American Original 60s Jazzmaster® | Guitarnet Live Lounge | 기타네트',
    trackUri: '5tTbEXp6eWs',
  },
];
