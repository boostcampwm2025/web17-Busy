# VIBR 모바일 앱 개발 계획

## 개요

웹 앱(`apps/web`)을 기반으로 React Native(Expo) 모바일 앱을 개발한다.
비즈니스 로직(API, 스토어, hooks)은 최대한 웹과 공유하고, UI 레이어만 모바일용으로 새로 작성한다.

---

## 1단계 — 인프라 (공통 코드 공유 구조)

웹과 모바일이 API 클라이언트, Zustand 스토어를 공유할 수 있도록 `packages/`로 이동.

- [ ] `apps/web/src/api/` → `packages/api/`로 이동 (또는 모바일에서 직접 참조)
- [ ] 공유할 Zustand 스토어 이동 (`usePlayerStore`, `useAuthStore` 등)
- [ ] 인증 흐름 구현 — 로그인 화면 + 토큰 저장 (`expo-secure-store`)

---

## 2단계 — 앱 뼈대 (라우팅 구조)

```
app/
  _layout.tsx           ← 루트 레이아웃, 인증 분기
  (auth)/
    login.tsx           ← 로그인 화면
  (tabs)/
    _layout.tsx         ← 하단 탭 네비게이션
    index.tsx           ← 피드
    search.tsx          ← 검색
    profile.tsx         ← 프로필
```

- [ ] 루트 레이아웃에서 로그인 여부에 따라 `(auth)` / `(tabs)` 분기
- [ ] 하단 탭 네비게이션 구성

---

## 3단계 — 화면 구현 순서

| 순서 | 화면          | 웹 참조 파일                                        | 비고                      |
| ---- | ------------- | --------------------------------------------------- | ------------------------- |
| 1    | 피드          | `components/feed/FeedView.tsx`, `FeedList.tsx`      | 기본 카드 UI 패턴 확립    |
| 2    | 미니 플레이어 | `components/player/MiniPlayerBar.tsx`               | 모든 탭 하단에 고정       |
| 3    | 풀 플레이어   | `components/player/NowPlaying.tsx`, `QueueList.tsx` | 바텀시트 또는 모달로 구현 |
| 4    | 검색          | `components/search/`                                | 피드 카드 컴포넌트 재사용 |
| 5    | 프로필        | `components/profile/`                               | 상대적으로 독립적         |
| 6    | 포스트 작성   | `components/modals/ContentWriteModal/`              | 복잡도 높아서 마지막      |

---

## 공유 가능한 코드 목록

| 경로                       | 공유 여부      | 비고                  |
| -------------------------- | -------------- | --------------------- |
| `packages/dto`             | 바로 사용 가능 | API 타입 정의         |
| `apps/web/src/api/`        | 이동 후 공유   | fetch 로직            |
| `apps/web/src/stores/`     | 이동 후 공유   | Zustand 스토어        |
| `apps/web/src/hooks/`      | 일부 공유      | UI 의존 hooks 제외    |
| `apps/web/src/components/` | 재사용 불가    | RN 전용으로 새로 작성 |
