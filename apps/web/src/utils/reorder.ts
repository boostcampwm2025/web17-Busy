/**
 * 바뀐 게 없으면 새 배열을 만들지 않고 받은 배열을 그대로 돌려준다.
 * 호출부가 참조 비교만으로 불필요한 서버 요청과 리렌더를 건너뛸 수 있다.
 */
export const reorder = <T>(arr: T[], index: number, direction: 'up' | 'down'): T[] => {
  const swapIndex = direction === 'up' ? index - 1 : index + 1;

  const a = arr[index];
  const b = arr[swapIndex];

  if (!a || !b) return arr;

  const next = [...arr];
  next[index] = b;
  next[swapIndex] = a;
  return next;
};

/** 위와 같은 규칙으로, 이동할 곳이 없으면 받은 배열을 그대로 돌려준다. */
export const moveTo = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to) return arr;
  if (from < 0 || from >= arr.length) return arr;
  if (to < 0 || to >= arr.length) return arr;

  const next = [...arr];
  const [item] = next.splice(from, 1);
  if (!item) return arr;

  next.splice(to, 0, item);
  return next;
};
