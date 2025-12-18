<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=venom&height=200&text=VIBR&fontSize=70&color=gradient&animation=twinkling" />
</p>


<p align="center">
  <b>Connect through Music</b><br/>
  <sub>추천하고 · 바로 듣고 · 반응하고 · 저장하고 · 사람을 통해 다시 발견합니다.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/사람%20기반%20추천-8A2BE2?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/끊김%20없는%20흐름-4C6EF5?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/음악%20아이덴티티-2DE2E6?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/전곡%20바로듣기-3CD1A3?style=for-the-badge&labelColor=0B0B10" />
</p>

---

## 🎧 VIBR는 무엇인가요?

**VIBR는 음악 중심 소셜 큐레이션 플랫폼**입니다.  
목표는 단 하나: **음악 추천을 ‘링크 공유’가 아니라 ‘흐름’으로 만드는 것**.

대부분의 음악 공유는 이렇게 끝납니다.  
“링크 보내기 → 다른 앱 열기 → 나중에 까먹기”

VIBR는 이 과정을 한 화면에서 연결합니다.

**추천 → 미리듣기 → 반응 → 저장 → 탐색(사람/프로필)**

---

## ✅ 제품 원칙 (Product Principles)

- **사람 기반 추천**
  - 알고리즘 유사도 대신, 취향이 맞는 사람을 팔로우하며 음악을 발견합니다.

- **끊김 없는 경험**
  - 피드에서 바로 **전곡 바로듣기** → 마음에 들면 **보관함/플레이리스트 저장**까지.

- **음악 아이덴티티**
  - 내가 추천한 곡들이 프로필에 쌓여, **나를 설명하는 음악 프로필**이 됩니다.

- **반응이 남는 공유**
  - 좋아요/댓글로 “이 노래 뭐야?” 같은 반응이 기록되고, 다음 추천을 만듭니다.

---

## ⚡ 핵심 플로우 (MVP)

1) 곡 검색(Spotify/Apple 메타데이터)  
2) 추천 포스트 작성(단일 곡 + 코멘트)  
3) 피드에서 전곡 바로듣기  
4) 좋아요/댓글 반응  
5) 보관함/프라이빗 플레이리스트 저장  
6) 추천자 프로필 탐색 → 팔로우로 취향 그래프 확장  

---

## 🧩 핵심 기능

| 기능 | 하는 일 | 왜 중요한가 |
|---|---|---|
| 🏠 **피드(Feed)** | 팔로우한 사람의 추천 음악을 타임라인으로 제공 + 즉시 미리듣기/저장/반응 | 링크 공유의 단절 제거 |
| ✍️ **포스트(Post)** | 곡 선택 + 한 줄 코멘트로 ‘맥락 있는 추천’ 생성 | 큐레이션의 이유가 남음 |
| 👤 **프로필(Profile)** | 추천한 곡이 쌓이는 시각적 프로필 | 취향이 ‘정체성’으로 축적 |
| 📚 **보관함(Library)** | 나중에 듣기/프라이빗 플레이리스트 관리 | 재방문과 습관 형성 |
| 🔍 **검색(Search)** | 곡/아티스트 + 사용자 검색 | 사람 기반 탐색 확장 |
| 🤝 **협업 플레이리스트** | 함께 담고(공동 편집) 같이 듣는(동시 청취) 세션 | 피드 이상의 소셜 경험 |

---

## 🛠️ 기술 스택 (Technology Stack)

| Category | Stack |
|---|---|
| 🏗️ Common Infrastructure | <img src="https://img.shields.io/badge/pnpm-111111?style=for-the-badge&logo=pnpm&logoColor=F69220" /> <img src="https://img.shields.io/badge/Turborepo-111111?style=for-the-badge&logo=turborepo&logoColor=white" /> <img src="https://img.shields.io/badge/TypeScript-111111?style=for-the-badge&logo=typescript&logoColor=3178C6" /> <img src="https://img.shields.io/badge/Husky-111111?style=for-the-badge&logo=git&logoColor=white" /> <img src="https://img.shields.io/badge/lint--staged-111111?style=for-the-badge&logo=github&logoColor=white" /> |
| 💻 Frontend | <img src="https://img.shields.io/badge/React-111111?style=for-the-badge&logo=react&logoColor=61DAFB" /> <img src="https://img.shields.io/badge/Vite-111111?style=for-the-badge&logo=vite&logoColor=646CFF" /> <img src="https://img.shields.io/badge/Zustand-111111?style=for-the-badge&logo=react&logoColor=white" /> <img src="https://img.shields.io/badge/TailwindCSS-111111?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" /> <img src="https://img.shields.io/badge/SVGR-111111?style=for-the-badge&logo=svg&logoColor=white" /> |
| 🗄️ Backend | <img src="https://img.shields.io/badge/NestJS-111111?style=for-the-badge&logo=nestjs&logoColor=E0234E" /> <img src="https://img.shields.io/badge/TypeORM-111111?style=for-the-badge&logo=typeorm&logoColor=FE0803" /> <img src="https://img.shields.io/badge/MySQL-111111?style=for-the-badge&logo=mysql&logoColor=4479A1" /> <img src="https://img.shields.io/badge/Redis-111111?style=for-the-badge&logo=redis&logoColor=DC382D" /> |
| 🧪 Quality & Testing | <img src="https://img.shields.io/badge/ESLint-111111?style=for-the-badge&logo=eslint&logoColor=4B32C3" /> <img src="https://img.shields.io/badge/Prettier-111111?style=for-the-badge&logo=prettier&logoColor=F7B93E" /> <img src="https://img.shields.io/badge/Vitest-111111?style=for-the-badge&logo=vitest&logoColor=6E9F18" /> <img src="https://img.shields.io/badge/Jest-111111?style=for-the-badge&logo=jest&logoColor=C21325" /> |
| ☁️ Infra / CI-CD | <img src="https://img.shields.io/badge/NCP-03C75A?style=for-the-badge&logoColor=white" /> <img src="https://img.shields.io/badge/Docker-111111?style=for-the-badge&logo=docker&logoColor=2496ED" /> <img src="https://img.shields.io/badge/GitHub%20Actions-111111?style=for-the-badge&logo=githubactions&logoColor=2088FF" /> |

---

## 🌟 Team Members

| 구분 | J048 김승호 | J055 김예빈 | J100 문예찬 | J237 장재혁 |
|:---:|:---:|:---:|:---:|:---:|
| Avatar | <img src="https://github.com/seunghok22.png" width="120"/> | <img src="https://github.com/yebinGold.png" width="120"/> | <img src="https://github.com/myc0603.png" width="120"/> | <img src="https://github.com/Jae-Hyuk-Jang.png" width="120"/> |
| 이름&nbsp;/&nbsp;영문 | **J048&nbsp;김승호**<br/>Seung-Ho Kim | **J055&nbsp;김예빈**<br/>Ye-Bin Kim | **J100&nbsp;문예찬**<br/>Ye-Chan Moon | **J237&nbsp;장재혁**<br/>Jae-Hyuk Jang |
| GitHub | [seunghok22](https://github.com/seunghok22) | [yebinGold](https://github.com/yebinGold) | [myc0603](https://github.com/myc0603) | [Jae-Hyuk-Jang](https://github.com/Jae-Hyuk-Jang) |
