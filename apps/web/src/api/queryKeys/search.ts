const searchKey = ['search'] as const;
const userSearchKey = [...searchKey, 'users'] as const;
const itunesSearchKey = [...searchKey, 'itunes'] as const;
const youtubeSearchKey = [...searchKey, 'youtube'] as const;

export const searchQueryKeys = {
  /** 검색 결과 전체에 함께 반영해야 하는 갱신의 프리픽스 */
  all: searchKey,
  /** 팔로우 상태처럼 검색어·limit과 무관하게 모든 사용자 검색 결과에 반영해야 하는 갱신의 프리픽스 */
  userLists: userSearchKey,
  /** limit이 다르면 페이지 경계가 달라져 다른 결과를 담으므로 key에 포함한다. */
  users: (query: string, limit: number) => [...userSearchKey, query, limit] as const,
  /**
   * 외부 API(iTunes) 검색 결과. 우리 리소스가 아니라 mutation으로 갱신되지 않으므로
   * 프리픽스 단위 무효화 대상이 아니다. 결과를 바꾸는 파라미터를 모두 key에 담는다.
   */
  itunes: (query: string, limit: number, country: string) => [...itunesSearchKey, query, limit, country] as const,
  /** 외부 API(YouTube) 검색 결과. 서버 라우트가 keyword만 받으므로 key도 검색어까지만 담는다. */
  youtube: (query: string) => [...youtubeSearchKey, query] as const,
} as const;
