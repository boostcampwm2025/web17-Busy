export interface OnboardingSlide {
  id: number;
  title: string;
  image: string;
  description: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: '나만의 BGM과 함께 포스트 작성',
    image: '/images/onboarding-1.png',
    description: '좋아하는 음악을 검색하고, 커버 이미지와 함께 이야기를 공유하세요.',
  },
  {
    id: 2,
    title: '끊김 없는 백그라운드 플레이어',
    image: '/images/onboarding-2.png',
    description: '피드를 보면서도 하단의 미니 플레이어로 음악을 계속 감상할 수 있습니다.',
  },
  {
    id: 3,
    title: '마음에 드는 음악은 아카이브로',
    image: '/images/onboarding-3.png',
    description: '다른 유저의 포스트에서 발견한 명곡을 내 플레이리스트에 쏙 담아보세요.',
  },
];
