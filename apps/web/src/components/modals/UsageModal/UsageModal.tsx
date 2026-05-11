'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalStore } from '@/stores/useModalStore';
import { ONBOARDING_SLIDES } from './Onboarding';

export const UsageModal = () => {
  const { closeModal } = useModalStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 현재 슬라이드 데이터 참조
  const currentSlide = ONBOARDING_SLIDES[currentIndex];
  if (!currentSlide) return null;

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (!isLastSlide) setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-[8px_8px_0px_0px_var(--color-primary)] border-2 border-primary flex flex-col overflow-hidden transition-all">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
          <h2 className="text-xl font-black text-primary">사용 설명서</h2>
          <button onClick={closeModal} className="p-1 hover:bg-gray-4 rounded-full transition-colors group" aria-label="닫기">
            <X className="w-6 h-6 text-primary group-hover:text-accent-pink transition-colors" />
          </button>
        </div>

        {/* 바디 (콘텐츠) 영역 */}
        <div className="p-6 flex flex-col bg-white">
          <div className="flex flex-col items-center py-2 text-center">
            {/* 이미지 컨테이너 */}
            <div className="mb-6 flex h-64 w-full items-center justify-center rounded-xl bg-gray-100/80 border-2 border-transparent">
              <img src={currentSlide.image} alt={currentSlide.title} className="h-full w-full object-contain p-4" />
            </div>

            {/* 텍스트 컨테이너 */}
            <h2 className="mb-3 text-xl font-black text-primary">{currentSlide.title}</h2>
            <p className="mb-4 h-12 text-sm font-bold text-gray-600 break-keep">{currentSlide.description}</p>
          </div>

          {/* 하단 컨트롤 영역 */}
          <div className="flex items-center justify-between mt-4">
            {/* 인디케이터 (현재 페이지 표시 점) */}
            <div className="flex gap-2 pl-2">
              {ONBOARDING_SLIDES.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-primary' : 'w-2.5 bg-gray-300'}`}
                />
              ))}
            </div>

            {/* 이전/다음 컨트롤 버튼 */}
            <div className="flex gap-2">
              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  이전
                </button>
              )}
              <button
                onClick={isLastSlide ? closeModal : handleNext}
                className="rounded-xl border-2 border-primary bg-primary px-5 py-2 text-sm font-black text-white transition hover:bg-primary/90 active:translate-y-0.5"
              >
                {isLastSlide ? '시작하기' : '다음'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
