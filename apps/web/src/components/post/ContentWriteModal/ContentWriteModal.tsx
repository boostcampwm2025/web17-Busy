import { toast } from 'react-toastify';
import type { MusicResponseDto as Music } from '@repo/dto';

import { ModalShell } from '@/components/common/ModalShell';
import { useContentWrite } from '@/hooks/post/useContentWrite';
import { useModalStore } from '@/stores/useModalStore';

import { ContentWriteFooter } from './partials/ContentWriteFooter';
import { ContentWriteHeader } from './partials/ContentWriteHeader';
import { CoverImgUploader } from './partials/CoverImgUploader';
import { MusicSearch } from './partials/MusicSearch';
import { PostContentField } from './partials/PostContentField';
import { SelectedMusicList } from './partials/SelectedMusicList';

type Props = {
  initialMusics?: Music[];
};

export const ContentWriteModal = ({ initialMusics }: Props) => {
  const handleClose = useModalStore((s) => s.closeModal);

  const handleWriteSuccess = () => {
    toast.success('새 글이 등록되었습니다.');
    handleClose();
  };

  const {
    selectedMusics,
    content,
    setContent,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    activeCover,
    isSubmitDisabled,
    onFileChange,
    onAddMusic,
    onAddPlaylist,
    onRemoveMusic,
    onMoveMusic,
    onSubmit,
  } = useContentWrite({ initialMusics, onSuccess: handleWriteSuccess });

  return (
    // 작성 중인 내용이 날아가지 않도록 배경 클릭으로 닫지 않는다.
    <ModalShell onClose={handleClose} size="xl" closeOnBackdrop={false} cardClassName="max-h-[90vh]">
      <ContentWriteHeader onClose={handleClose} />

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <CoverImgUploader currentCover={activeCover} onFileChange={onFileChange} />
          <SelectedMusicList musics={selectedMusics} onRemove={onRemoveMusic} onMove={onMoveMusic} />
        </div>

        <MusicSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          onAddMusic={onAddMusic}
          onAddPlaylist={onAddPlaylist}
        />

        <PostContentField value={content} onChange={setContent} />
      </div>

      <ContentWriteFooter isSubmitDisabled={isSubmitDisabled} onSubmit={() => void onSubmit()} />
    </ModalShell>
  );
};
