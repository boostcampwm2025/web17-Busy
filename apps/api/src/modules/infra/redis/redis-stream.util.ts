export function kvToObj(kv: string[]) {
  return Object.fromEntries(
    Array.from({ length: kv.length / 2 }, (_, i) => [kv[i * 2], kv[i * 2 + 1]]),
  ) as Record<string, string>;
}
