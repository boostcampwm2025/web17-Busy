# VIBR 모바일 앱 개발 계획

## 개요

웹 앱(`apps/web`)을 기반으로 React Native(Expo) 모바일 앱을 개발한다.
비즈니스 로직(API, 스토어, hooks)은 최대한 웹과 공유하고, UI 레이어만 모바일용으로 새로 작성한다.

---

## 1단계 — 인프라 (공통 코드 공유 구조)

웹과 모바일이 API 클라이언트, Zustand 스토어를 공유할 수 있도록 `packages/`로 이동.

- [x] `apps/web/src/api/` → `apps/mobile/src/api/`로 복사 후 모바일 전용 client 작성
  - 웹의 `client.ts`는 `sessionStorage`와 웹 전용 스토어(`useModalStore`, `useSpotifyAuthStore` 등)에 강하게 의존해 있어 그대로 공유 불가
  - `apps/mobile/src/api/client.ts`를 새로 작성: `sessionStorage` 대신 `expo-secure-store`로 토큰 저장/로드, 401 발생 시 모달 대신 `onSessionExpired` 콜백으로 처리
  - `auth.ts`, `post.ts`, `playlist.ts` 등 나머지 API 함수들은 `internalClient`만 쓰는 순수한 코드라 웹에서 그대로 복사
  - `auth.ts`의 `googleExchange`, `spotifyExchange`에서 쓰던 `process.env.INTERNAL_API_URL`(서버 사이드 전용)을 `EXPO_PUBLIC_API_BASE_URL`로 교체

- [x] 공유할 Zustand 스토어 이동 (`usePlayerStore`, `useAuthStore` 등)
  - `useAuthStore`, `usePlayerStore`, `useModalStore`, `usePostReactionOverridesStore`는 순수 Zustand 코드라 웹에서 그대로 복사해 `apps/mobile/src/stores/`에 배치
  - 의존성(`axios`, `zustand`, `expo-secure-store`, `@repo/dto`)을 `package.json`에 추가하고 `pnpm install` 실행

- [x] 인증 흐름 구현 — 로그인 화면 + 토큰 저장 (`expo-secure-store`)
  - `app/(auth)/login.tsx` 생성: 현재는 `tmpLogin` 기반 임시 로그인 버튼, 추후 OAuth로 교체 예정
  - 로그인 성공 시 `saveToken()`으로 토큰을 `expo-secure-store`에 저장 후 `/(tabs)`로 이동
  - `.env` 파일에 `EXPO_PUBLIC_API_BASE_URL=http://{PC_IP}:3002/api` 설정

---

## 2단계 — 앱 뼈대 (라우팅 구조)

```
app/
  _layout.tsx           ← 루트 레이아웃, 인증 분기
  (auth)/
    login.tsx           ← 로그인 화면
  (tabs)/
    _layout.tsx         ← 하단 탭 네비게이션 + 미니 플레이어 오버레이
    index.tsx           ← 피드
    search.tsx          ← 검색
    profile.tsx         ← 프로필
```

- [x] 루트 레이아웃에서 로그인 여부에 따라 `(auth)` / `(tabs)` 분기
  - `app/_layout.tsx`에서 앱 시작 시 `authMe()`를 호출해 토큰 유효 여부 확인
  - 성공하면 `useAuthStore`에 인증 상태 저장 후 `/(tabs)`로, 실패하면 `/(auth)/login`으로 라우팅
  - `setOnSessionExpired` 콜백 등록: 토큰 만료로 401이 발생하면 자동으로 로그인 화면으로 이동

- [x] 하단 탭 네비게이션 구성
  - `app/(tabs)/_layout.tsx`에 피드 / 검색 / 프로필 탭 구성
  - 미니 플레이어를 탭바 바로 위에 절대 위치로 오버레이

---

## 3단계 — 화면 구현 순서

| 순서 | 화면          | 웹 참조 파일                                        | 상태 | 비고                      |
| ---- | ------------- | --------------------------------------------------- | ---- | ------------------------- |
| 1    | 피드          | `components/feed/FeedView.tsx`, `FeedList.tsx`      | ✅   | 기본 카드 UI 패턴 확립    |
| 2    | 미니 플레이어 | `components/player/MiniPlayerBar.tsx`               | ✅   | 탭바 위 고정              |
| 3    | 풀 플레이어   | `components/player/NowPlaying.tsx`, `QueueList.tsx` | ✅   | 바텀시트 또는 모달로 구현 |
| 4    | 검색          | `components/search/`                                | ✅   | 피드 카드 컴포넌트 재사용 |
| 5    | 프로필        | `components/profile/`                               | ⬜   | 상대적으로 독립적         |
| 6    | 포스트 작성   | `components/modals/ContentWriteModal/`              | ⬜   | 복잡도 높아서 마지막      |

### 피드 화면 구현 상세

- [x] `src/utils/time.ts`, `src/utils/image.ts` — 웹에서 복사 (순수 함수)
- [x] `src/constants/index.ts` — `DEFAULT_IMAGES` 정의
- [x] `src/stores/usePostReactionOverridesStore.ts` — 웹에서 복사 (낙관적 업데이트용)
- [x] `src/hooks/usePostMedia.ts` — 웹에서 복사 (슬라이드 상태 로직, 순수)
- [x] `src/hooks/useFeedInfiniteScroll.ts` — RN용으로 새로 작성 (`useInView` → FlatList `onEndReached` + `RefreshControl`)
- [x] `src/components/post/partials/PostHeader.tsx` — 프로필 이미지, 닉네임, 더보기 메뉴 (수정/삭제)
- [x] `src/components/post/partials/PostMedia.tsx` — 이미지 슬라이드 캐러셀, 재생 버튼, 음악 정보
  - 커버 이미지: 전체 재생 버튼 + "전체 재생" 배지 (웹 머지 내용 반영)
  - 음악 슬라이드: 개별 곡 재생 버튼 + 곡 정보 배지
  - `TouchableOpacity` → `View`로 교체해 FlatList와 스와이프 제스처 충돌 해결
- [x] `src/components/post/partials/PostActions.tsx` — 좋아요, 댓글, 공유 버튼
- [x] `src/components/post/partials/PostContentPreview.tsx` — 본문 3줄 미리보기
- [x] `src/components/post/PostCard.tsx` — 낙관적 좋아요/취소, 전체 재생(`addToQueue` + `selectMusic`) 포함
- [x] `app/(tabs)/index.tsx` — FlatList 기반 피드, 무한스크롤, 당겨서 새로고침, 삭제 반영
- [ ] 포스트 상세 화면 연결 (`onOpenDetail`) — 추후 구현 예정

### 미니 플레이어 구현 상세

- [x] `src/components/player/MiniPlayer.tsx` — 앨범 커버, 곡 정보, 재생/일시정지, 이전/다음 버튼
- [x] `app/(tabs)/_layout.tsx` — 탭바 위 절대 위치로 MiniPlayer 오버레이
- [x] 풀 플레이어 연결 (`onOpenFullPlayer`)

### 풀 플레이어 구현 상세

- [x] `src/stores/usePlayerStore.ts` — `setIsPlaying` 액션 추가 (YouTube 실제 재생 상태 → store 동기화)
- [x] `src/hooks/player/useItunesHook.ts` — expo-av 기반 iTunes 재생 훅
- [x] `src/hooks/player/useYouTubeHook.ts` — react-native-youtube-iframe 기반 YouTube 재생 훅
  - 250ms 폴링으로 positionMs/durationMs 갱신 (pending 플래그로 리스너 누수 방지)
  - onChangeState에서 store setIsPlaying 동기화
- [x] `src/components/player/FullPlayer.tsx` — 슬라이더, 컨트롤, 재생목록, 비우기 버튼
- [x] `app/(tabs)/_layout.tsx` — zIndex 방식으로 FullPlayer 오버레이
  - YouTube 트랙 선택 시 파생 상태로 동기 오픈 (useEffect 지연 없음)
  - opacity/translateY 사용 금지 (Android WebView 재생 차단/suspend 이슈)
- [x] `useSafeAreaInsets` 적용으로 갤럭시 하단 네비게이션 바 가림 수정

### 검색 화면 구현 상세

- [x] `src/api/itunes.ts` — iTunes Search API 직접 호출 (인증 불필요)
- [x] `src/api/youtube.ts` — YouTube Data API v3 직접 호출 (`EXPO_PUBLIC_YOUTUBE_API_KEY`)
- [x] `src/mappers/` — `itunesSongToMusic`, `youtubeVideoToMusic` (RN용 HTML 엔티티 디코드)
- [x] `src/hooks/useDebouncedValue.ts` — 범용 디바운스 훅
- [x] `src/hooks/search/useItunesSearch.ts` — debounce + AbortController
- [x] `src/hooks/search/useYoutubeSearch.ts` — debounce + 결과 캐시
- [x] `src/hooks/search/useUserSearch.ts` — cursor 페이지네이션 + loadMore
- [x] `src/hooks/search/useSearchScreen.ts` — 음원/유튜브/사용자 탭 통합
- [x] `src/components/search/TrackItem.tsx` — 커버/썸네일, 곡 정보, 재생 버튼
- [x] `src/components/search/UserItem.tsx` — 프로필, 팔로우/언팔로우 (Optimistic UI)
- [x] `app/(tabs)/search.tsx` — 검색 입력, 탭 전환, FlatList 결과, 사용자 무한스크롤

---

## 공유 가능한 코드 목록

| 경로                       | 공유 여부             | 비고                               |
| -------------------------- | --------------------- | ---------------------------------- |
| `packages/dto`             | 바로 사용 가능        | API 타입 정의                      |
| `apps/web/src/api/`        | 복사 후 client만 교체 | fetch 로직은 재사용, client는 별도 |
| `apps/web/src/stores/`     | 복사 후 그대로 사용   | 순수 Zustand, 웹 의존성 없음       |
| `apps/web/src/hooks/`      | 일부 공유             | UI 의존 hooks 제외                 |
| `apps/web/src/components/` | 재사용 불가           | RN 전용으로 새로 작성              |
