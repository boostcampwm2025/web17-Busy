# Frontend Architecture

`apps/web`의 계층 구조와 폴더 배치 기준이다. lint로 강제되는 규칙은 `eslint.config.js`에 있다.

## 계층

상위는 하위를 자유롭게 import하지만, 하위는 상위를 import할 수 없다.

```
page  →  component  →  business  →  store  →  utility
```

| 계층      | 경로                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page      | `app/**`                                                                                                                                                        |
| component | `src/components/**`                                                                                                                                             |
| business  | `src/hooks/**`                                                                                                                                                  |
| store     | `src/stores/**`, `src/api/queryKeys/**`                                                                                                                         |
| utility   | `src/api/internal/**`, `src/api/itunes/**`, `src/api/youtube/**`, `src/api/auth-token.ts`, `src/utils/**`, `src/constants/**`, `src/types/**`, `src/mappers/**` |

"한 단계씩만"이 아니라 "자기보다 아래 어디든" 허용한다. hooks가 store와 utility를 함께 쓰는 것은 정상이다.

### lint로 막는 방향

| 규칙                               | 상태                                        |
| ---------------------------------- | ------------------------------------------- |
| utility → store/business/component | error                                       |
| store → business/component         | error                                       |
| business → component               | error                                       |
| component → API 직접 호출          | error (`queryKeys`와 `components/app` 제외) |

마지막 규칙 때문에 컴포넌트는 서버 데이터에 hooks를 거쳐서만 접근한다. 컴포넌트가 API를 직접 부르면
query cache 밖에서 상태가 갈라져, 목록은 갱신됐는데 상세는 예전 값으로 남는 종류의 버그가 생긴다.

## components 배치 기준

| 폴더                                       | 기준                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `common/`                                  | feature에 속하지 않고 어디서든 갖다 쓰는 프레젠테이션 컴포넌트 |
| `app/`                                     | 루트에 한 번 마운트되어 앱 전체를 배선하는 것                  |
| `layout/`, `sidebar/`                      | 화면 골격                                                      |
| 그 외 (`post/`, `playlist/`, `profile/` …) | feature 폴더. 그 feature에서만 쓰는 것은 전부 여기             |

기준은 **"몇 곳에서 쓰이나"가 아니라 "어디에 속하나"**다. 한 곳에서만 쓰여도 feature에 속하지 않으면
`common/`에 두고(`ErrorScreen`), 여러 곳에서 쓰여도 한 feature 것이면 그 feature 폴더에 둔다.

`app/`은 feature 코드가 돌기 전에 세션 토큰·401 핸들러 같은 횡단 관심사를 배선해야 해서
utility를 직접 다룰 수 있다. 위 lint 표에서 이 폴더만 예외인 이유다.

### feature 폴더 내부

- 모달은 기술적 그룹이 아니라 소속 feature에 둔다. `PostCardDetailModal`은 `post/`,
  `PlaylistDetailModal`은 `playlist/`에 있다.
- 컴포넌트 하나가 여러 파일로 쪼개지면 `partials/`에 모은다.

## hooks 배치 기준

| 폴더                           | 기준                                               |
| ------------------------------ | -------------------------------------------------- |
| `common/`                      | 도메인을 모르는 범용 훅                            |
| 그 외 (`post/`, `playlist/` …) | 도메인 훅. components의 feature 폴더와 짝을 맞춘다 |

`hooks/`에는 React 컴포넌트를 두지 않는다. 렌더링 결과가 없는 effect 전용 컴포넌트라도
JSX로 마운트된다면 컴포넌트이므로 `components/app/`에 둔다.

도메인 폴더 안에서는 역할을 파일명으로 드러낸다.

| 접미사                | 내용                                           |
| --------------------- | ---------------------------------------------- |
| `use-*-query.ts`      | 조회                                           |
| `use-*-mutations.ts`  | 변경                                           |
| `*-cache-updaters.ts` | 여러 mutation이 공유하는 query cache 갱신 헬퍼 |

## 파일명

새로 만드는 파일은 kebab-case다(`use-post-mutations.ts`). camelCase 파일이 남아 있는 것은
이전 관행이고, 건드리는 김에 함께 바꾼다. 컴포넌트 파일은 PascalCase를 유지한다.

## 폴더명

폴더는 담고 있는 것을 따른다. 파일명 규칙의 연장이지 별도 규칙이 아니다.

| 폴더             | 규칙       | 예                                            |
| ---------------- | ---------- | --------------------------------------------- |
| 컴포넌트 폴더    | PascalCase | `NowPlaying/`, `PlaylistDetailModal/`         |
| 그룹·도메인 폴더 | kebab-case | `hooks/player/`, `partials/`, `api/internal/` |
| 라우트 세그먼트  | kebab-case | `app/post/`, `app/api/youtube-search/`        |

컴포넌트 폴더가 PascalCase인 것은 대표 파일과 이름이 같아야 하기 때문이다
(`NowPlaying/NowPlaying.tsx`). 폴더를 열지 않고도 어느 컴포넌트인지 보인다.
`partials/`는 컴포넌트가 아니라 묶음이므로 kebab이다.

`app/`의 `[id]`·`(home)`은 Next.js App Router 문법이라 이 규칙 밖이다.

**camelCase는 어디에도 쓰지 않는다.** `api/queryKeys/`,
`components/auth/LoginModal/loginButtons/`가 남아 있는데 이전 관행이고, 파일명과 마찬가지로
건드리는 김에 바꾼다.

폴더명은 lint로 강제하지 않는다. 위 세 종류를 한 패턴으로 표현하려면 읽을 수 없는 설정이
필요한데, 그렇게까지 해서 잡히는 것이 위 camelCase 2개뿐이라 규칙을 문서에만 둔다.
파일명은 lint가 강제한다(`.tsx`는 PascalCase, `.ts`는 kebab-case).

## import 경로

배럴(`index.ts`)을 거치지 않고 직접 경로로 import한다.

```ts
import { useModalStore } from '@/stores/useModalStore'; // O
import { useModalStore } from '@/stores'; // X
```

배럴을 거치면 쓰지도 않는 모듈이 딸려 오고, 심볼이 실제로 어디 있는지 알 수 없어진다.
기존 배럴은 아직 남아 있지만 새 코드에서는 쓰지 않는다.
