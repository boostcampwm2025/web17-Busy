import React from 'react';
import { X, ImagePlus } from 'lucide-react';
import { useModalStore } from '@components/stores/useModalStore';

export const ContentWriteModal = () => {
  const { closeModal } = useModalStore();

  return (
    // 1. 배경 (Backdrop)
    // ModalContainer에서 조건부 렌더링되므로 isOpen 체크 불필요
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in">
      {/* 2. 모달 컨테이너 (Card) */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[8px_8px_0px_0px_#00214D] border-2 border-primary flex flex-col max-h-[90vh] overflow-hidden transition-all">
        {/* 3. 헤더 (Header) */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          {/* 타이틀 하드코딩 */}
          <h2 className="text-xl font-black text-primary">새 게시물 만들기</h2>
          <button onClick={closeModal} className="p-1 hover:bg-gray-4 rounded-full transition-colors group">
            <X className="w-6 h-6 text-primary group-hover:text-accent-pink transition-colors" />
          </button>
        </div>

        {/* 4. 컨텐츠 영역 (Body) - children 대신 실제 폼 구현 */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
          {/* 텍스트 입력 영역 */}
          <textarea
            className="w-full h-40 p-4 resize-none outline-none text-lg placeholder:text-gray-2 text-primary"
            placeholder="어떤 음악 이야기를 나누고 싶으신가요?"
          />

          {/* 이미지/미디어 첨부 영역 예시 */}
          <div className="border-2 border-dashed border-gray-3 rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-gray-4 transition-colors cursor-pointer group">
            <div className="p-3 bg-gray-4 rounded-full group-hover:bg-white transition-colors">
              <ImagePlus className="w-6 h-6 text-gray-1" />
            </div>
            <span className="text-gray-1 font-bold text-sm">사진 또는 영상 추가</span>
          </div>
        </div>

        {/* 5. 푸터 (Footer) - 등록 버튼 */}
        <div className="p-6 border-t-2 border-primary bg-white shrink-0 flex justify-end">
          <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-darkblue active:translate-y-1 transition-all">
            게시하기
          </button>
        </div>
      </div>
    </div>
  );
};
