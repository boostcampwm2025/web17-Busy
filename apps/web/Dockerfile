# 1. Prune 단계: 모노레포에서 web 앱에 필요한 것만 추출
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

# 2. Builder 단계: 의존성 설치 및 빌드
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Prune 단계에서 추출한 package.json 및 락파일 복사
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# 패키지 설치
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# 환경변수 복사
ARG NEXT_PUBLIC_SPOTIFY_API_BASE_URL

# ENV로 변환하여 빌드 명령어에 전달
ENV NEXT_PUBLIC_SPOTIFY_API_BASE_URL=$NEXT_PUBLIC_SPOTIFY_API_BASE_URL

# Next.js 빌드 (환경변수가 빌드 타임에 필요하다면 ARG로 주입)
RUN pnpm turbo run build --filter=web...

# 3. Runner 단계: Node.js로 Next.js 서버 실행 (SSR 지원)
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat tzdata
ENV TZ=UTC
RUN cp /usr/share/zoneinfo/${TZ} /etc/localtime && echo "${TZ}" > /etc/timezone

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_APP_ORIGIN=https://vibr.site

# TZ 고정(UTC)
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 보안을 위해 시스템 유저 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# [핵심] Standalone 빌드 결과물 복사
# standalone 폴더 안에는 node_modules와 최소한의 서버 코드가 포함됨
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# [핵심] 정적 파일(이미지, CSS, JS) 복사 (SSR/CSR 정상 작동을 위해 필수)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3001

# server.js 실행
CMD ["node", "apps/web/server.js"]