const userListKey = ['user-list'] as const;

export const userQueryKeys = {
  /** 팔로우 상태처럼 열려 있는 모든 사용자 목록에 함께 반영해야 하는 갱신의 프리픽스 */
  lists: userListKey,
  /** 팔로워 목록과 팔로잉 목록은 같은 사용자에 대해 서로 다른 결과를 담으므로 title로 구분한다. */
  list: (title: string, userId: string) => [...userListKey, title, userId] as const,
} as const;
