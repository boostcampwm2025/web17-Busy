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

## 🎧 VIBR는 무엇인가요? 사람 중심의 음악 취향 공유 공간

**VIBR**는 **“링크 공유”로 끝나던 음악 추천을, 한 화면에서 이어지는 “흐름”으로 바꾸는 서비스**입니다.

> **음악 추천 → 바로 듣기 → 반응 → (내 취향으로) 축적 → 사람을 통해 재발견**

 

## 🧩 Why Now? (우리가 해결하려는 문제)

### 🌀 알고리즘 피로도

스트리밍 추천은 장르 유사성 중심으로 ‘필터 버블’을 만들고, 유저는 뻔한 추천에 지쳐 **새로운 음악을 능동적으로 발견(Digging)하고 싶어합니다.**

### 🫧 휘발되는 공유

링크 공유는 **휘발성이 강하고 아카이빙이 어렵습니다.**  
“내가 이 음악을 발굴했다”는 **음악적 정체성** 을 표현하기엔 텍스트 링크만으로는 부족합니다.

 

## 💡 Our Solution (VIBR의 해법)

- 🖼️ **Visualized Feed**
  - 앨범 커버를 강조한 **카드형 피드 UI**로 탐색 몰입과 시각적 만족을 극대화합니다.

- 🎭 **Music Identity**
  - 추천이 프로필과 피드에 쌓이며, **나의 음악적 색깔이 ‘브랜딩’** 됩니다.

- 🤝 **Human Curation**
  - 알고리즘이 아닌, **사람과 관계 기반의 신뢰도 높은 추천**을 지향합니다.

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
docker compose up -d
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
![GitHook](https://img.shields.io/badge/Husky_(Git_Hook)-F05032.svg?style=for-the-badge&logo=git&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)  

### Infrastructure
![Naver Cloud Platform](https://img.shields.io/badge/naver_cloud_platform-%2303C75A.svg?style=for-the-badge&logo=naver&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)


## ☁️ 인프라 아키텍처 

<img width="934" height="688" alt="image" src="https://github.com/user-attachments/assets/8225ba82-1afa-402d-996e-51cc7a99013d" />

---

## 🌟 팀원 소개

|                        J048 김승호                         |                        J055 김예빈                        |                       J100 문예찬                       |                          J237 장재혁                          |
| :--------------------------------------------------------: | :-------------------------------------------------------: | :-----------------------------------------------------: | :-----------------------------------------------------------: |
| <img src="https://github.com/seunghok22.png" width="120"/> | <img src="https://github.com/yebinGold.png" width="120"/> | <img src="https://github.com/myc0603.png" width="120"/> | <img src="https://github.com/Jae-Hyuk-Jang.png" width="120"/> |
|           **J048&nbsp;김승호**<br/>Seung-Ho Kim            |            **J055&nbsp;김예빈**<br/>Ye-Bin Kim            |          **J100&nbsp;문예찬**<br/>Ye-Chan Moon          |            **J237&nbsp;장재혁**<br/>Jae-Hyuk Jang             |
|        [seunghok22](https://github.com/seunghok22)         |         [yebinGold](https://github.com/yebinGold)         |          [myc0603](https://github.com/myc0603)          |       [Jae-Hyuk-Jang](https://github.com/Jae-Hyuk-Jang)       |
