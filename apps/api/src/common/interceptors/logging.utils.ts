import type { Request } from 'express';

export const stripQuery = (url: string): string => {
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(0, idx) : url;
};

/**
 * main.ts에서 app.setGlobalPrefix('api')를 쓰고 있어서
 * req.originalUrl은 보통 '/api/like?...' 형태
 * -> 저장 시에는 '/like'로 정규화
 */
export const stripApiPrefix = (path: string): string => {
  return path.startsWith('/api/') ? path.slice(4) : path;
};

export const normalizePathFromReq = (req: Request): string => {
  const raw = req.originalUrl || req.url || '';
  return stripApiPrefix(stripQuery(raw));
};

/**
 * AuthGuard가 req.user(payload)를 주입하는 전제
 * - 로그인 전용 정책이라 userId는 "반드시 있어야" 정상
 * - 다만 런타임 안전성을 위해 없으면 빈 문자열 반환(로깅 스킵용)
 */
export const getUserIdFromReq = (req: any): string => {
  const u = req.user;
  const id = u?.sub ?? u?.id;
  return typeof id === 'string' && id.trim().length > 0 ? id : '';
};

/**
 * sessionId는 optional(사실상 무시) 정책
 * - FE가 헤더로 보내면 사용
 * - 없으면 undefined 반환(서버에서 굳이 fallback 생성하지 않음)
 */
export const getSessionIdFromReq = (req: Request): string | undefined => {
  const h =
    (req.headers['x-vibr-session-id'] as string | undefined) ||
    (req.headers['x-session-id'] as string | undefined);

  if (!h) return undefined;

  const v = h.trim();
  return v.length > 0 ? v : undefined;
};
