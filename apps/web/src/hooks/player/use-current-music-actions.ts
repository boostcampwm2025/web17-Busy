import type { MusicResponseDto as Music } from '@repo/dto';

import useMusicActions from '@/hooks/common/useMusicActions';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { MODAL_TYPES, useModalStore } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

/**
 * 지금 재생 중인 곡을 글쓰기·보관함으로 넘긴다.
 *
 * 로그인 확인과 곡 존재 확인을 여기서 끝내므로 호출부는 버튼에 바로 연결하면 된다.
 * MiniPlayerBar와 NowPlaying이 같은 판단을 써야 해서 어느 한쪽이 아니라 여기에 둔다.
 */
export const useCurrentMusicActions = () => {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const { isAuthenticated } = useAuthMe();
  const openModal = useModalStore((s) => s.openModal);
  const { openWriteModalWithMusic, addMusicToArchive } = useMusicActions();

  const runWithCurrentMusic = (run: (music: Music) => Promise<void>) => {
    if (!isAuthenticated) {
      openModal(MODAL_TYPES.LOGIN);
      return;
    }
    if (!currentMusic) return;

    // 실패는 useMusicActions가 토스트로 처리한다. 여기서 await하면 클릭 핸들러가 그 결과를 기다릴 뿐이다.
    void run(currentMusic);
  };

  const post = () => runWithCurrentMusic(openWriteModalWithMusic);
  const save = () => runWithCurrentMusic(addMusicToArchive);

  return { post, save };
};
