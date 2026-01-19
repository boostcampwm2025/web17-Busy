export const MOCK_PROFILE = {
  userId: '11111111-1111-1111-1111-111111111111',
  nickname: '테스트 사용자 1',
  profileImgUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=128',
  bio: '하이요~~',
  followerCount: 10,
  followingCount: 10,
  isFollowing: false,
};

export const MOCK_PROFILE_POSTS = [
  {
    id: 'p-1',
    coverImgUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music4/v4/36/89/c9/3689c99a-f88e-d019-b7b2-83a3eb8a379b/4897028491172_Cover.jpg/600x600bb.jpg',
    content: '요즘 밤에 듣기 딱 좋은 곡. 분위기 미쳤음.',
    likeCount: 124,
    commentCount: 12,
    isMoreThanOneMusic: false,
  },
  {
    id: 'p-2',
    coverImgUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/03/4d/0a/034d0a44-d7d8-9aa8-a58c-5e5b9b3ccd2c/ANTCD-A0000012700.jpg/600x600bb.jpg',
    content: '드라이브할 때 꼭 듣는 곡들 모아봤어.',
    likeCount: 89,
    commentCount: 5,
    isMoreThanOneMusic: true,
  },
  {
    id: 'p-3',
    coverImgUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/73/d6/b5/73d6b59d-aa86-e8c9-1c3a-c011ac57f306/artwork.jpg/600x600bb.jpg',

    content: '작업할 때 듣기 좋은 노동요 추천.',
    likeCount: 245,
    commentCount: 34,
    isMoreThanOneMusic: false,
  },
  {
    id: 'p-4',
    coverImgUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/1e/90/d2/1e90d2f1-b833-f236-ec7b-107edd0350ac/coffee-break.jpg/600x600bb.jpg',
    content: '카페에서 듣기 좋은 재즈 감성.',
    likeCount: 56,
    commentCount: 8,
    isMoreThanOneMusic: false,
  },
  {
    id: 'p-5',
    coverImgUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/72/29/d9/7229d9e9-f620-f800-cec5-e2a554ebe9ba/4550752377807_cover.png/600x600bb.jpg',
    content: '비 오는 날 감성 플리에서 한 곡 픽!',
    likeCount: 210,
    commentCount: 45,
    isMoreThanOneMusic: false,
  },
];
