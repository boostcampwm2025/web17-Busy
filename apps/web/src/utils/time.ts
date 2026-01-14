const MS = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
} as const;

export const formatRelativeTime = (iso: string): string => {
  const createdAt = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - createdAt);

  if (diff < MS.minute) return '방금 전';
  if (diff < MS.hour) return `${Math.floor(diff / MS.minute)}분 전`;
  if (diff < MS.day) return `${Math.floor(diff / MS.hour)}시간 전`;
  return `${Math.floor(diff / MS.day)}일 전`;
};
