const consentsKey = ['consents'] as const;

export const consentQueryKeys = {
  /** 동의 내역 갱신을 함께 반영해야 하는 조회의 프리픽스 */
  all: consentsKey,
  /** 로그인 사용자의 최근 동의 내역. 사용자당 하나뿐이라 파라미터가 없다. */
  recent: [...consentsKey, 'recent'] as const,
} as const;
