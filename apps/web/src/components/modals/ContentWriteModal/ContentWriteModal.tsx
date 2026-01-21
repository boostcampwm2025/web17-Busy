import React from 'react';
import { X, FolderOpen } from 'lucide-react';

import { useModalStore } from '@/stores';
import { CoverImgUploader, MusicSearch, SelectedMusicList } from './index';

import type { MusicResponseDto as Music } from '@repo/dto';
import { useContentWrite } from '@/hooks';
import { useRouter } from 'next/navigation';

export const ContentWriteModal = ({ initialMusic }: { initialMusic?: Music }) => {
  const { closeModal } = useModalStore();
  const router = useRouter();

  const handleWriteSuccess = () => {
    closeModal();
    router.push('/');
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
  } = useContentWrite({
    initialMusic,
    onSuccess: handleWriteSuccess,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[8px_8px_0px_0px_var(--color-primary)] border-2 border-primary flex flex-col max-h-[90vh] overflow-hidden transition-all">
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          <h2 className="text-xl font-black text-primary">새 게시물 만들기</h2>
          <button onClick={closeModal} className="p-1 hover:bg-gray-4 rounded-full transition-colors group">
            <X className="w-6 h-6 text-primary group-hover:text-accent-pink transition-colors" />
          </button>
        </div>

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

          <div className="mb-2">
            <label className="text-sm font-bold text-gray-1 mb-2 block">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 음악에 대한 이야기를 들려주세요..."
              className="w-full h-32 p-4 rounded-xl border-2 border-primary text-primary bg-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:bg-gray-4/30 resize-none font-medium custom-scrollbar placeholder:text-gray-2 transition-colors"
            />
          </div>
        </div>

        <div className="p-6 border-t-2 border-primary bg-white shrink-0 flex items-center justify-between">
          <button className="flex items-center text-gray-1 font-bold hover:text-primary transition-colors">
            <FolderOpen className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">임시 보관함</span>
          </button>

          <div className="flex gap-3">
            <button className="px-6 py-2.5 rounded-full font-bold border-2 border-gray-3 text-gray-1 hover:border-primary hover:text-primary hover:bg-gray-4 transition-colors">
              임시 저장
            </button>
            <button
              className="px-8 py-2.5 rounded-full font-bold bg-primary text-white border-2 border-primary hover:bg-white hover:text-primary hover:shadow-[4px_4px_0px_0px_var(--color-accent-cyan)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={isSubmitDisabled}
              onClick={onSubmit}
            >
              등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
