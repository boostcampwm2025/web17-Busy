# vibr 프로젝트 구조

음악 소셜 플랫폼 — pnpm + Turborepo 모노레포

## 전체 구조

```
vibr/
├── apps/
│   ├── api/              # NestJS 백엔드
│   └── web/              # Next.js 14 프론트엔드
├── packages/
│   ├── dto/              # API ↔ Web 공유 DTO
│   ├── ui/               # 공유 UI 컴포넌트 (현재 거의 미사용)
│   ├── eslint-config/    # ESLint 설정 공유
│   └── typescript-config/# TS 설정 공유
├── nginx/                # nginx 리버스 프록시 설정
├── compose.yml           # 로컬 인프라 (MySQL, Redis, Neo4j)
└── turbo.json            # 빌드 파이프라인
```

---

## apps/api — NestJS 백엔드

### 인프라 (DB/캐시)

| 서비스              | 용도                            |
| ------------------- | ------------------------------- |
| MySQL 8.4 + TypeORM | 주 데이터베이스                 |
| Redis               | 트렌딩 점수, Stream 이벤트 처리 |
| Neo4j               | 그래프 기반 추천 알고리즘 (GDS) |

### 모듈 목록

| 모듈           | 역할                                                           |
| -------------- | -------------------------------------------------------------- |
| `auth`         | Google / Spotify OAuth 인증, JWT 발급                          |
| `user`         | 유저 프로필 조회·수정·검색                                     |
| `post`         | 게시글 CRUD (음악 첨부 포함)                                   |
| `comment`      | 댓글 CRUD                                                      |
| `like`         | 좋아요 / 좋아요한 유저 목록                                    |
| `follow`       | 팔로우·언팔로우·팔로워 목록                                    |
| `feed`         | 피드 합성 — following / trending / recent 소스를 정책으로 혼합 |
| `music`        | 음악 메타데이터 저장                                           |
| `playlist`     | 플레이리스트 CRUD                                              |
| `now-playlist` | 현재 재생 큐 서버 동기화                                       |
| `noti`         | 알림 (팔로우, 좋아요, 댓글 등)                                 |
| `trending`     | Redis Stream으로 이벤트 수집 → 인기 점수 관리 + 시간 감쇠 Job  |
| `algorithm`    | Neo4j GDS 기반 추천 로직                                       |
| `log`          | 클라이언트 행동 로그 수집                                      |
| `upload`       | 이미지 파일 업로드 (로컬 디스크)                               |
| `privacy`      | 개인정보 동의 항목 관리                                        |
| `seed`         | 개발용 더미 데이터 생성                                        |

### 공통 레이어 (`src/common/`)

| 폴더            | 역할                                            |
| --------------- | ----------------------------------------------- |
| `guards/`       | JWT 인증 가드, 선택적 인증 가드                 |
| `decorators/`   | `@UserId()` 파라미터 데코레이터                 |
| `filter/`       | 전역 예외 필터                                  |
| `interceptors/` | 댓글·팔로우·좋아요 이벤트를 Redis Stream에 기록 |

---

## apps/web — Next.js 14 프론트엔드

### 페이지 (`app/`)

| 경로                    | 역할                                           |
| ----------------------- | ---------------------------------------------- |
| `(home)/`               | 메인 피드                                      |
| `archive/`              | 내 플레이리스트 보관함                         |
| `post/[id]/`            | 게시글 상세                                    |
| `profile/[id]/`         | 유저 프로필 / 게시글 목록                      |
| `setting/`              | 설정 (개인정보 동의 포함)                      |
| `auth/google\|spotify/` | OAuth 콜백 처리                                |
| `api/youtube-search/`   | YouTube API 프록시 (서버 라우트, 키 노출 방지) |
| `offline/`              | PWA 오프라인 페이지                            |

### 컴포넌트 (`src/components/`)

| 폴더        | 역할                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `feed/`     | 피드 무한 스크롤 목록                                                      |
| `post/`     | PostCard + 헤더·미디어·액션 파셜                                           |
| `player/`   | NowPlaying, SeekBar, VolumeControl, 큐 목록, 미니 플레이어 바              |
| `modals/`   | ContentWriteModal, PostCardDetailModal, PlaylistDetailModal, LoginModal 등 |
| `layout/`   | 헤더, 모바일 하단 내비, 바텀시트, 알림 오버레이                            |
| `sidebar/`  | 사이드바 드로어, 메뉴 버튼                                                 |
| `noti/`     | 알림 아이템·드로어·폴링 게이트                                             |
| `profile/`  | 프로필 정보, 팔로우 통계, 포스트 피드                                      |
| `search/`   | 음악·유저 검색 드로어                                                      |
| `skeleton/` | 로딩 스켈레톤                                                              |

### 전역 상태 — Zustand (`src/stores/`)

| 스토어                  | 관리 상태                            |
| ----------------------- | ------------------------------------ |
| `usePlayerStore`        | 재생 큐, 현재 곡, 재생 중 여부, 볼륨 |
| `useAuthStore`          | 로그인 유저 정보                     |
| `useModalStore`         | 모달 열림/닫힘                       |
| `useNotiStore`          | 알림 목록                            |
| `useSpotifyPlayerStore` | Spotify Web Playback SDK 상태        |
| `useFeedRefreshStore`   | 피드 새로고침 트리거                 |
| `useProfileStore`       | 프로필 캐시                          |

### 커스텀 훅 (`src/hooks/`)

| 폴더/파일   | 역할                                                         |
| ----------- | ------------------------------------------------------------ |
| `player/`   | YouTube IFrame API 연동, 재생 틱, 진행바 동기화, iTunes 연동 |
| `auth/`     | OAuth 플로우, 토큰 교환, 로그인 상태 부트스트랩              |
| `search/`   | iTunes·YouTube·유저 검색 (디바운스 적용)                     |
| `queue/`    | 게스트 큐 세션, 서버 큐 동기화                               |
| `noti/`     | 알림 폴링                                                    |
| `post/`     | 게시글 작성, 좋아요, 미디어 처리                             |
| `playlist/` | 플레이리스트 추천                                            |
| `privacy/`  | 개인정보 동의 게이트                                         |

### API 클라이언트 (`src/api/`)

| 폴더        | 역할                              |
| ----------- | --------------------------------- |
| `internal/` | 백엔드 REST API 호출 (fetch 래퍼) |
| `itunes/`   | iTunes 음악 검색                  |
| `spotify/`  | Spotify 트랙 검색                 |
| `youtube/`  | YouTube 영상 검색                 |

### 기타 `src/` 하위

| 폴더         | 역할                                                       |
| ------------ | ---------------------------------------------------------- |
| `mappers/`   | iTunes·Spotify·YouTube 응답 → 내부 `Music` 타입으로 통일   |
| `types/`     | TypeScript 타입 정의 (comment, player, search, sidebar 등) |
| `constants/` | 상수 및 개발용 mock 데이터                                 |
| `utils/`     | 공통 유틸리티 (clamp, time, image, reorder 등)             |

---

## packages/dto — 공유 타입 패키지

API와 Web이 **같은 DTO를 import**하여 타입 불일치를 방지한다.
모든 도메인의 req/res DTO와 enum 포함 (comment, feed, follow, like, log, music, noti, now-playlist, playlist, post, privacy, user).

---

## 핵심 데이터 흐름

```
외부 음악 API (iTunes / YouTube / Spotify)
         ↓ 검색
Web (Next.js) ────── REST ──────▶ API (NestJS)
      ↑                                ↓
  Zustand 전역 상태            MySQL  (게시글, 유저, 플레이리스트)
  - 재생 큐                    Redis  (트렌딩 점수, Stream 이벤트)
  - 인증                       Neo4j  (팔로우 그래프, 콘텐츠 추천)
  - 모달/알림
```

### 복잡도가 높은 영역

- **feed 모듈** — following / trending / recent 세 소스를 `SourceAllocationPolicy`와 `FeedCompositionPolicy`로 혼합하여 피드를 합성
- **player** — YouTube IFrame API와 iTunes를 추상화하고, `now-playlist` API로 서버 큐와 실시간 동기화
- **trending** — 좋아요·팔로우·댓글 인터셉터가 Redis Stream에 이벤트를 기록하면 `TrendingStreamConsumer`가 소비, `TrendingDecayJob`이 주기적으로 점수를 감쇠
