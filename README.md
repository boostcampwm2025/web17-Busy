<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=venom&height=200&text=VIBR&fontSize=70&color=gradient&animation=twinkling" />
</p>

<p align="center">
  <b>VIBE + RESONANCE</b><br/>
  <sub>알고리즘의 편향에서 벗어난 <b>사람(Human) 기반</b> 소셜 뮤직 큐레이션 플랫폼</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/사람%20기반%20큐레이션-8A2BE2?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/시각적%20피드-4C6EF5?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/음악%20아이덴티티-2DE2E6?style=for-the-badge&labelColor=0B0B10" />
  <img src="https://img.shields.io/badge/전역%20플레이어-3CD1A3?style=for-the-badge&labelColor=0B0B10" />
</p>

---

## 🎧 사람 중심의 음악 취향 공유 공간, VIBR

> **"Vibe"**(분위기) + **"Resonance"**(공명)

음악으로 나를 표현하고 타인의 취향을 탐험하는 소셜 뮤직 큐레이션 플랫폼, **VIBR(바이버)** 입니다.

#### 👨🏻‍🤝‍👨🏻 기계적인 알고리즘 추천이 아닌, 사람이 중심이 되는 음악 공유 공간

> 맨날 비슷한 노래만 나오네...

- 알고리즘의 장르적 유사성에서 벗어나 사람과 사람을 연결하는 **사람 기반의 알고리즘**을 제공합니다.
- 누군가가 직접 발굴한 새로운 음악, 즉 **'음악 디깅(Digging)'** 에 대한 리스너들의 갈증을 해소합니다.

#### 🔗 공유와 반응의 단절을 하나의 흐름으로

> 추천 링크 보냈는데, 들어는 봤을까...?

- 텍스트 형태의 링크 공유 방식은 금방 대화창 위로 올라가서 잊혀지게 되고, 공유하는 입장에서도 충분한 반응을 얻기 어렵습니다.
- "링크 공유"로 끝나던 음악 추천을, 한 화면에서 이어지는 **[추천 - 재생 - 반응]** "흐름"으로 만듭니다.
- 하나의 서비스 안에서 서로의 음악적 분위기를 공유하고, 그 취향에 공명하며 즉각적인 반응을 주고받는 **이어진 경험**을 제공합니다.

#### 🎶 누구나 제약 없이 음악을 공유하고 즉시 재생할 수 있는 경험

> 너 멜론 써? 나 스포티파이 쓰는데...

- 음악 플랫폼이 달라서 발생하는 공유와 재생의 단절을 해결합니다.
- 상대방이 어떤 앱을 쓰든 상관없이, 누구나 같은 환경에서 음악을 재생할 수 있는 공간을 제공합니다.

<br>

자세한 내용은 [서비스 기획서](https://github.com/boostcampwm2025/web17-Busy/wiki/%EC%84%9C%EB%B9%84%EC%8A%A4-%EA%B8%B0%ED%9A%8D%EC%84%9C)를 참고해주세요.

---

## 서비스 실제 사용 화면

![ezgif-66f35fbb95e46c12](https://github.com/user-attachments/assets/114e24eb-cf65-4788-997f-eab61f38008b)

---

## 💻 로컬 Setup

### Requirements

- **Node.js >= 18** (권장: LTS)
- **pnpm** (workspace 기준)

### Install

```bash
corepack enable
pnpm -v
pnpm install
```

### Run Database

```bash
docker compose -f compose.dev.yml up -d
```

### Run Dev

```bash
pnpm dto # FE/BE 공통 dto 패키지 빌드
pnpm dev # 개발 서버 전체 실행 (web + api)
```

### 그 외 스크립트 명령어

```bash
pnpm lint
pnpm check-types
pnpm build
pnpm format
```

<br>

## 🛠 기술 스택

### Frontend

![Next JS](https://img.shields.io/badge/NextJS-black?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/zustand-453F39?style=for-the-badge)

### Backend

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803.svg?style=for-the-badge&logo=typeorm&logoColor=white)

![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Neo4J](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)

### Common

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)

### Environment

![Turborepo](https://img.shields.io/badge/turborepo-%23EF4444.svg?style=for-the-badge&logo=turborepo&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)
![GitHook](<https://img.shields.io/badge/Husky_(Git_Hook)-F05032.svg?style=for-the-badge&logo=git&logoColor=white>)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)

### Infrastructure

![Naver Cloud Platform](https://img.shields.io/badge/naver_cloud_platform-%2303C75A.svg?style=for-the-badge&logo=naver&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)

<br>

## ☁️ 인프라 아키텍처

<img width="1755" alt="image" src="https://github.com/user-attachments/assets/a6d78da1-46b1-45be-839f-86bd284028b1" />

<br>

자세한 내용은 [배포/인프라 설계서](https://github.com/boostcampwm2025/web17-Busy/wiki/%EB%B0%B0%ED%8F%AC---%EC%9D%B8%ED%94%84%EB%9D%BC)를 참고해주세요.

---

## 🌟 팀원 소개

|                        J048 김승호                         |                        J055 김예빈                        |                       J100 문예찬                       |                          J237 장재혁                          |
| :--------------------------------------------------------: | :-------------------------------------------------------: | :-----------------------------------------------------: | :-----------------------------------------------------------: |
| <img src="https://github.com/seunghok22.png" width="120"/> | <img src="https://github.com/yebinGold.png" width="120"/> | <img src="https://github.com/myc0603.png" width="120"/> | <img src="https://github.com/Jae-Hyuk-Jang.png" width="120"/> |
|           **J048&nbsp;김승호**<br/>Seung-Ho Kim            |            **J055&nbsp;김예빈**<br/>Ye-Bin Kim            |          **J100&nbsp;문예찬**<br/>Ye-Chan Moon          |            **J237&nbsp;장재혁**<br/>Jae-Hyuk Jang             |
|        [seunghok22](https://github.com/seunghok22)         |         [yebinGold](https://github.com/yebinGold)         |          [myc0603](https://github.com/myc0603)          |       [Jae-Hyuk-Jang](https://github.com/Jae-Hyuk-Jang)       |
