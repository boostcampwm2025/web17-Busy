import type { InternalAxiosRequestConfig } from 'axios';

export type LogMeta = {
  eligible: boolean;
  startAt: number;
  eventType?: string;
  targets?: {
    postId?: string;
    userId?: string;
  };
  meta?: Record<string, unknown>;
};

type LoggableConfig = Pick<InternalAxiosRequestConfig, 'method' | 'url'> & {
  data?: any;
};

const LOGS_PATH = '/logs';
const SESSION_ID_KEY = 'vibr_session_id_v1';
const MAX_URL_LEN = 255;

export const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

const safeJsonParse = (v: unknown): any => {
  if (typeof v !== 'string') return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.trim().length > 0) return existing;

    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(SESSION_ID_KEY, next);
    return next;
  } catch {
    return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
};

export const normalizeMethod = (m?: string): string => (m ? m.toUpperCase() : 'GET');

export const normalizePath = (url?: string): string => {
  const u = (url ?? '').trim();
  if (!u) return '';
  const qIdx = u.indexOf('?');
  const base = qIdx >= 0 ? u.slice(0, qIdx) : u;
  return base.slice(0, MAX_URL_LEN);
};

const isLogsPath = (url?: string): boolean => {
  const path = normalizePath(url);
  return path === LOGS_PATH || path.endsWith(LOGS_PATH);
};

/**
 * API 로깅 메타 생성
 * - GET은 기본 제외(폴링/무한스크롤 노이즈 방지)
 * - mutation(POST/PUT/PATCH/DELETE) 중 화이트리스트만 eligible=true
 * - /logs 자체 호출은 제외
 */
export const buildLogMeta = (cfg: LoggableConfig): LogMeta => {
  const startAt = nowMs();

  if (isLogsPath(cfg.url)) return { eligible: false, startAt };

  const method = normalizeMethod(cfg.method);
  const path = normalizePath(cfg.url);

  // 기본 정책: GET 제외
  if (method === 'GET') return { eligible: false, startAt };

  const dataRaw = cfg.data;
  const dataObj = typeof dataRaw === 'string' ? safeJsonParse(dataRaw) : dataRaw;

  // --- LIKE ---
  if (method === 'POST' && path === '/like') {
    const postId = dataObj?.postId;
    return {
      eligible: Boolean(postId),
      startAt,
      eventType: 'LIKE_ADD',
      targets: postId ? { postId } : undefined,
    };
  }

  if (method === 'DELETE' && path.startsWith('/like/')) {
    const postId = path.split('/')[2] ?? '';
    return {
      eligible: Boolean(postId),
      startAt,
      eventType: 'LIKE_REMOVE',
      targets: postId ? { postId } : undefined,
    };
  }

  // --- COMMENT ---
  if (method === 'POST' && path === '/comment') {
    const postId = dataObj?.postId;
    const content = typeof dataObj?.content === 'string' ? dataObj.content : '';
    return {
      eligible: Boolean(postId),
      startAt,
      eventType: 'COMMENT_CREATE',
      targets: postId ? { postId } : undefined,
      meta: content ? { length: content.length } : undefined,
    };
  }

  // --- FOLLOW ---
  if (method === 'POST' && path === '/follow') {
    const otherUserId = dataObj?.otherUserId;
    return {
      eligible: Boolean(otherUserId),
      startAt,
      eventType: 'FOLLOW_ADD',
      targets: otherUserId ? { userId: otherUserId } : undefined,
    };
  }

  if (method === 'DELETE' && path === '/follow') {
    const otherUserId = dataObj?.otherUserId;
    return {
      eligible: Boolean(otherUserId),
      startAt,
      eventType: 'FOLLOW_REMOVE',
      targets: otherUserId ? { userId: otherUserId } : undefined,
    };
  }

  // --- NOW PLAYLIST ---
  if (method === 'PUT' && path === '/nowPlaylist') {
    const ids = Array.isArray(dataObj?.musicIds) ? dataObj.musicIds : [];
    return {
      eligible: true,
      startAt,
      eventType: 'NOWPLAYLIST_UPDATE',
      meta: { count: ids.length },
    };
  }

  // --- POST (create/delete) ---
  if (method === 'POST' && path === '/post') {
    // multipart(FormData)일 수 있음 → musicCount만 추출
    let musicCount: number | undefined;
    try {
      if (typeof FormData !== 'undefined' && dataRaw instanceof FormData) {
        const musics = dataRaw.get('musics');
        if (typeof musics === 'string') {
          const arr = safeJsonParse(musics);
          if (Array.isArray(arr)) musicCount = arr.length;
        }
      }
    } catch {
      // ignore
    }

    return {
      eligible: true,
      startAt,
      eventType: 'POST_CREATE',
      meta: musicCount !== undefined ? { musicCount } : undefined,
    };
  }

  if (method === 'DELETE' && path.startsWith('/post/')) {
    const postId = path.split('/')[2] ?? '';
    return {
      eligible: Boolean(postId),
      startAt,
      eventType: 'POST_DELETE',
      targets: postId ? { postId } : undefined,
    };
  }

  // --- PLAYLIST ---
  if (method === 'POST' && path === '/playlist') {
    return {
      eligible: true,
      startAt,
      eventType: 'PLAYLIST_CREATE',
    };
  }

  // /playlist/:id/music (add)
  if (method === 'POST' && path.startsWith('/playlist/') && path.endsWith('/music')) {
    const parts = path.split('/');
    const playlistId = parts[2] ?? '';
    const musics = Array.isArray(dataObj?.musics) ? dataObj.musics : [];
    return {
      eligible: Boolean(playlistId),
      startAt,
      eventType: 'PLAYLIST_ADD_MUSICS',
      meta: { playlistId, count: musics.length },
    };
  }

  // /playlist/:id/music (reorder)
  if (method === 'PUT' && path.startsWith('/playlist/') && path.endsWith('/music')) {
    const parts = path.split('/');
    const playlistId = parts[2] ?? '';
    const ids = Array.isArray(dataObj?.musicIds) ? dataObj.musicIds : [];
    return {
      eligible: Boolean(playlistId),
      startAt,
      eventType: 'PLAYLIST_REORDER_MUSICS',
      meta: { playlistId, count: ids.length },
    };
  }

  // 선택사항
  if (method === 'PATCH' && path.startsWith('/playlist/')) {
    const playlistId = path.split('/')[2] ?? '';
    return {
      eligible: Boolean(playlistId),
      startAt,
      eventType: 'PLAYLIST_EDIT_TITLE',
      meta: { playlistId },
    };
  }

  if (method === 'DELETE' && path.startsWith('/playlist/')) {
    const playlistId = path.split('/')[2] ?? '';
    return {
      eligible: Boolean(playlistId),
      startAt,
      eventType: 'PLAYLIST_DELETE',
      meta: { playlistId },
    };
  }

  return { eligible: false, startAt };
};
