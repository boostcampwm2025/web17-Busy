const searchKey = ['search'] as const;
const userSearchKey = [...searchKey, 'users'] as const;

export const searchQueryKeys = {
  /** 검색 결과 전체에 함께 반영해야 하는 갱신의 프리픽스 */
  all: searchKey,
  /** 팔로우 상태처럼 검색어·limit과 무관하게 모든 사용자 검색 결과에 반영해야 하는 갱신의 프리픽스 */
  userLists: userSearchKey,
  /** limit이 다르면 페이지 경계가 달라져 다른 결과를 담으므로 key에 포함한다. */
  users: (query: string, limit: number) => [...userSearchKey, query, limit] as const,
} as const;
