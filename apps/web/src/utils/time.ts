const MS = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

export type FutureMode = 'just-now' | 'in';

const parseIsoToMs = (iso: string, assumeUtcWhenNoTz = false): number | null => {
  const raw = (iso ?? '').trim();
  if (!raw) return null;

  const hasTz = raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw) || /[+-]\d{4}$/.test(raw);

  const normalized = !hasTz && assumeUtcWhenNoTz ? raw.replace(' ', 'T') + 'Z' : raw.replace(' ', 'T');

  const t = new Date(normalized).getTime();
  return Number.isFinite(t) ? t : null;
};

const formatKoreanRelative = (diffMs: number): string => {
  if (diffMs < MS.minute) return '방금 전';
  if (diffMs < MS.hour) return `${Math.floor(diffMs / MS.minute)}분 전`;
  if (diffMs < MS.day) return `${Math.floor(diffMs / MS.hour)}시간 전`;
  return `${Math.floor(diffMs / MS.day)}일 전`;
};

const formatKoreanFuture = (diffMs: number): string => {
  if (diffMs < MS.minute) return '잠시 후';
  if (diffMs < MS.hour) return `${Math.floor(diffMs / MS.minute)}분 후`;
  if (diffMs < MS.day) return `${Math.floor(diffMs / MS.hour)}시간 후`;
  return `${Math.floor(diffMs / MS.day)}일 후`;
};

/**
 * 상대 시간 표시 (한국어)
 * @param iso 서버에서 내려온 createdAt (ISO 권장)
 * @param assumeUtcWhenNoTz "YYYY-MM-DD HH:mm:ss" 같은 TZ 없는 문자열을 UTC로 간주할지
 * @param futureMode 서버/DB 시간이 미래로 찍혔을 때 처리 정책
 */
export const formatRelativeTime = (iso: string, assumeUtcWhenNoTz = false, futureMode: FutureMode = 'just-now'): string => {
  const createdAt = parseIsoToMs(iso, assumeUtcWhenNoTz);
  if (createdAt === null) return '';

  const diff = Date.now() - createdAt;

  if (diff < 0) {
    const abs = Math.abs(diff);
    return futureMode === 'in' ? formatKoreanFuture(abs) : '방금 전';
  }

  return formatKoreanRelative(diff);
};

export const formatMs = (ms: number): string => {
  const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
