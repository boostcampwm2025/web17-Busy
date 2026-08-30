import { useRouter } from 'next/navigation';

import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { coalesceImageSrc } from '@/utils/image';
import { CloseButton } from '@/components/common/CloseButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ModalShell } from '@/components/common/ModalShell';
import useLikedUsers from '@/hooks/post/use-liked-users';

type Props = {
  isOpen: boolean;
  postId: string;
  onClose: () => void;
};

export default function LikedUsersOverlay({ isOpen, postId, onClose }: Props) {
  const router = useRouter();

  // 목록은 부모를 거치지 않고 여기서 직접 구독한다. 같은 query key라 요청은 한 번만 나간다.
  const { users, isLoading, errorMsg, refetch: handleRetry } = useLikedUsers({ enabled: isOpen, postId });

  if (!isOpen) return null;

  const handleUserClick = (userId: string) => () => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  return (
    // 게시글 상세 모달 위에 겹쳐 뜨므로 overlay 층을 쓴다.
    <ModalShell onClose={onClose} size="md" layer="overlay" cardClassName="max-h-[60vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white">
        <h2 className="text-xl font-black text-primary">좋아요</h2>
        <CloseButton onClose={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="py-6">
            <LoadingSpinner />
          </div>
        ) : errorMsg ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <p className="font-bold text-sm">{errorMsg}</p>
            <button type="button" onClick={handleRetry} className="mt-3 text-xs font-bold underline text-gray-600">
              다시 시도
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 py-10">
            <p className="font-bold text-sm">좋아요한 사용자가 없습니다.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {users.map((u) => (
              <li key={u.id} className="flex items-center p-3 hover:bg-grayish rounded-xl transition-colors">
                <button type="button" onClick={handleUserClick(u.id)} className="relative shrink-0 w-10 h-10">
                  <img
                    src={coalesceImageSrc(u.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
                    alt={u.nickname}
                    className="w-full h-full rounded-full border border-primary object-cover"
                  />
                </button>
                <p className="ml-3 min-w-0 font-bold text-md text-primary truncate">{u.nickname}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
