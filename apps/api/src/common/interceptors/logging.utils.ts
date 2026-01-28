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
 * AuthGuard/AuthOptionalGuard가 (req as any).user = payload 로 주입
 * UserId.decorator.ts 로직과 동일하게 sub 우선
 */
export const getUserIdFromReq = (req: any): string | null => {
  const u = req.user;
  return u?.sub ?? u?.id ?? null;
};

/**
 * FE가 세션ID를 보내면 그걸 우선 사용(추적 정확도↑)
 * 없으면 서버에서 fallback 생성(분석용)
 */
export const getSessionIdFromReq = (req: Request): string => {
  const h =
    (req.headers['x-vibr-session-id'] as string | undefined) ||
    (req.headers['x-session-id'] as string | undefined);

  if (h && h.trim().length > 0) return h.trim();

  const ua = String(req.headers['user-agent'] ?? '');
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      ?.trim() ??
    req.ip ??
    '';

  return `be:${ip}:${ua.slice(0, 20) || 'ua'}:${Date.now()}`;
};
