import { toast } from 'react-toastify';

/**
 * 게시글 링크를 클립보드에 복사한다.
 *
 * 카드와 상세 모달 두 곳에서 같은 동작이 필요해 한 곳에 둔다.
 * 클립보드 API는 권한 거부·비보안 컨텍스트에서 거절하므로 호출부가 await하지 않아도 되도록 여기서 삼킨다.
 */
export const copyPostLink = async (postId: string): Promise<boolean> => {
  const link = `${window.location.origin}/post/${postId}`;

  try {
    await navigator.clipboard.writeText(link);
    toast.success('링크가 복사되었습니다!'); // 사용자 피드백
    return true;
  } catch (err) {
    console.error('링크 복사 실패:', err);
    toast.error('링크 복사에 실패했습니다.');
    return false;
  }
};
