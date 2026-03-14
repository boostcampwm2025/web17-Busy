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

# Nginx 설치 및 TZ 설정
RUN apk add --no-cache nginx tzdata
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /etc/nginx/ssl
COPY server.crt /etc/nginx/ssl/server.crt
COPY server.key /etc/nginx/ssl/server.key
RUN chmod 400 /etc/nginx/ssl/server.key

RUN ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# [핵심] Standalone 빌드 결과물 및 정적 파일 복사
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# 프로젝트 루트에 있는 nginx.conf를 컨테이너 설정 경로로 복사
# 빌드 컨텍스트에 따라 경로를 확인하세요 (예: apps/web/nginx/nginx.conf)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# 80(Nginx 외부용), 3001(Next.js 내부용) 개방
EXPOSE 80 443 3001

CMD nginx && HOSTNAME=127.0.0.1 node apps/web/server.js