export const toErrorMessage = (status: number): string => {
  if (status >= 500) return '서버 오류가 발생했습니다.';
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (status === 400) return '검색 요청 형식이 올바르지 않습니다.';
  return '검색 요청에 실패했습니다.';
};
