# 1. Prune 단계
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

# 2. Builder 단계
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
ARG NEXT_PUBLIC_SPOTIFY_API_BASE_URL
ENV NEXT_PUBLIC_SPOTIFY_API_BASE_URL=$NEXT_PUBLIC_SPOTIFY_API_BASE_URL
RUN pnpm turbo run build --filter=web...

# 3. Runner 단계 (Nginx + Node.js 통합)
FROM node:20-alpine AS runner
WORKDIR /app

# [수정] Nginx 설치 및 TZ 설정
RUN apk add --no-cache nginx tzdata
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# [핵심] Standalone 빌드 결과물 및 정적 파일 복사
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# [추가] 프로젝트 루트에 있는 nginx.conf를 컨테이너 설정 경로로 복사
# 빌드 컨텍스트에 따라 경로를 확인하세요 (예: apps/web/nginx/nginx.conf)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 80(Nginx 외부용), 3001(Next.js 내부용) 개방
EXPOSE 80 3001

# [중요] Nginx는 백그라운드(daemon off 옵션 제거 시)로, Node는 포어그라운드로 실행
CMD nginx && node apps/web/server.js