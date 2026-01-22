export const reorder = <T>(arr: T[], index: number, direction: 'up' | 'down'): T[] => {
  const next = [...arr];
  const swapIndex = direction === 'up' ? index - 1 : index + 1;

  const a = next[index];
  const b = next[swapIndex];

  if (!a || !b) return next;

  next[index] = b;
  next[swapIndex] = a;
  return next;
};
