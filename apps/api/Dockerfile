# 1. Prune 단계
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=api --docker

# 2. Builder 단계
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo run build --filter=api...

# 3. Runner 단계 (PM2 실행)
FROM node:20-alpine AS runner
RUN apk add --no-cache bash curl tzdata
RUN npm install -g pm2

WORKDIR /app

# 빌드된 결과물과 node_modules 복사 (Monorepo 구조 유지)
COPY --from=builder /app .

WORKDIR /app/apps/api
EXPOSE 3000

# pm2로 실행
CMD ["pm2-runtime", "dist/main.js"]