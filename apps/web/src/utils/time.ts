const MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

/**
 * ISO(UTC 'Z' 포함 권장)를 상대시간 문자열로 변환합니다.
 * - createdAt이 "미래"로 들어오는 경우(타임존/서버시간 불일치)도 방어 처리합니다.
 */
export const formatRelativeTime = (iso: string): string => {
  const createdAt = new Date(iso).getTime();
  if (!Number.isFinite(createdAt)) return '';

  const diff = Date.now() - createdAt;

  // 미래(서버/DB/클라 시간 불일치) 방어: 1분 이내 미래는 '방금 전'으로 처리
  if (diff < 0) {
    if (Math.abs(diff) < MS.minute) return '방금 전';
    // 미래가 크게 나오면 일단 '방금 전'으로 뭉개지 말고 '방금 전' 대신 표기
    return '방금 전';
  }

  if (diff < MS.minute) return '방금 전';
  if (diff < MS.hour) return `${Math.floor(diff / MS.minute)}분 전`;
  if (diff < MS.day) return `${Math.floor(diff / MS.hour)}시간 전`;
  return `${Math.floor(diff / MS.day)}일 전`;
};

export const formatMs = (ms: number): string => {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
