<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=venom&height=200&text=VIBR&fontSize=70&color=gradient&animation=twinkling" />
</p>

<p align="center">
  <b>VIBE + RESONANCE</b><br/>
  <sub>알고리즘의 편향에서 벗어난 <b>사람(Human) 기반</b> 소셜 뮤직 큐레이션 플랫폼</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/사람%20기반%20큐레이션-8A2BE2?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/비주얼%20피드-4C6EF5?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/음악%20아이덴티티-2DE2E6?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/전역%20플레이어%20지속성-3CD1A3?style=for-the-badge&labelColor=0B0B10" />
</p>

---

## 🎧 VIBR는 무엇인가요?

VIBR는 **“링크 공유”로 끝나던 음악 추천을, 한 화면에서 이어지는 “흐름”으로 바꾸는 서비스**입니다.

> **추천 → 바로 듣기 → 반응 → (내 취향으로) 축적 → 사람을 통해 재발견**

---

## 🧩 Why Now? (우리가 풀려는 문제)

### 🌀 알고리즘 피로도

스트리밍 추천은 장르 유사성 중심으로 ‘필터 버블’을 만들고, 유저는 뻔한 추천에 지쳐 **새로운 음악을 능동적으로 발견(Digging)하고 싶어합니다.**

### 🫧 휘발되는 공유

링크 공유는 **휘발성이 강하고 아카이빙이 어렵습니다.**  
“내가 이 음악을 발굴했다”는 **음악적 정체성** 을 표현하기엔 텍스트 링크만으로는 부족합니다.

---

## 💡 Our Solution (VIBR의 해법)

- 🖼️ **Visualized Feed**
  - 앨범 커버를 강조한 **카드형 피드 UI**로 탐색 몰입과 시각적 만족을 극대화합니다.

- 🎭 **Music Identity**
  - 추천이 프로필과 피드에 쌓이며, **나의 음악적 색깔이 ‘브랜딩’** 됩니다.

- 🤝 **Human Curation**
  - 알고리즘이 아닌, **사람과 관계 기반의 신뢰도 높은 추천**을 지향합니다.

---

## ✅ Key Values (제품 원칙)

- ⚡ **즉각적인 상호작용**
  - 카드형 UI + 퀵 액션으로 **재생/좋아요 같은 행동이 바로 이어집니다.**
- 🔁 **끊김 없는 청취 경험**
  - 페이지를 이동해도 재생이 유지되는 **전역 플레이어(Persistence)** 를 중심으로 설계합니다.
- 🚀 **빠른 UX**
  - 좋아요/팔로우 등은 **Optimistic UI**로 “누르는 즉시” 반응하는 경험을 제공합니다.

---

---

## 🌟 Team Members

|         구분          |                        J048 김승호                         |                        J055 김예빈                        |                       J100 문예찬                       |                          J237 장재혁                          |
| :-------------------: | :--------------------------------------------------------: | :-------------------------------------------------------: | :-----------------------------------------------------: | :-----------------------------------------------------------: |
|        Avatar         | <img src="https://github.com/seunghok22.png" width="120"/> | <img src="https://github.com/yebinGold.png" width="120"/> | <img src="https://github.com/myc0603.png" width="120"/> | <img src="https://github.com/Jae-Hyuk-Jang.png" width="120"/> |
| 이름&nbsp;/&nbsp;영문 |           **J048&nbsp;김승호**<br/>Seung-Ho Kim            |            **J055&nbsp;김예빈**<br/>Ye-Bin Kim            |          **J100&nbsp;문예찬**<br/>Ye-Chan Moon          |            **J237&nbsp;장재혁**<br/>Jae-Hyuk Jang             |
|        GitHub         |        [seunghok22](https://github.com/seunghok22)         |         [yebinGold](https://github.com/yebinGold)         |          [myc0603](https://github.com/myc0603)          |       [Jae-Hyuk-Jang](https://github.com/Jae-Hyuk-Jang)       |

## 🧰 기술 스택

<img width="604" height="660" alt="image" src="https://github.com/user-attachments/assets/1bc480fa-ce3a-412f-9284-d0514d8e1cd8" />

## ☁️ NCP 인프라 아키텍처 설계도

<img width="934" height="688" alt="image" src="https://github.com/user-attachments/assets/8225ba82-1afa-402d-996e-51cc7a99013d" />

---

## 🧑‍💻 Local Setup (Workspace)

### Requirements

- **Node.js >= 18** (권장: LTS)
- **pnpm** (workspace 기준)

### Install

```bash
corepack enable
pnpm -v
pnpm install
```

### Run (Dev)

```bash
pnpm dev
```

### Useful Commands

```bash
pnpm lint
pnpm check-types
pnpm build
pnpm format
```

---

## ✅ Git Hooks & Commit Convention

이 레포는 **Husky + lint-staged + commitlint**로 커밋 품질을 자동으로 보장

- `pre-commit`: staged 파일 기준으로 **Prettier/ESLint 자동 적용**
- `commit-msg`: **Conventional Commits** 규칙을 강제 (commitlint)

### Commit message format

```bash
type(scope): summary #issueNumber
```

**Allowed types**

`feat | fix | docs | style | refactor | test | chore | revert | perf | ci | design`

예시)

```bash
chore(tooling): stabilize husky hooks #21
feat(feed): add infinite scroll #34
```

> 커밋이 막히는 경우 대부분 훅에서 포맷/린트/커밋 메시지 규칙 위반이 원인입니다. 출력되는 로그를 먼저 확인해주세요.
