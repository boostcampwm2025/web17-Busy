/** 팔로워 숫자 포맷팅 함수 */
export const formatFollowCount = (count: number): string => {
  if (count < 1_000) {
    return count.toString();
  }

  if (count < 100_000) {
    const value = Math.floor(count / 100) / 10; // 소수 1자리 버림
    return value + 'K';
  }

  if (count < 1_000_000) {
    return Math.floor(count / 1_000).toString() + 'K';
  }

  const value = Math.floor(count / 100_000) / 10;
  return value + 'M';
};
