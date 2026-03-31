export const coalesceImageSrc = (src: string | null | undefined, fallback: string) => {
  const trimmed = src?.trim();
  return trimmed ? trimmed : fallback;
};
