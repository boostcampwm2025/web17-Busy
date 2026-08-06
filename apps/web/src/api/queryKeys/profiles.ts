export const profileQueryKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => [...profileQueryKeys.all, userId] as const,
} as const;
