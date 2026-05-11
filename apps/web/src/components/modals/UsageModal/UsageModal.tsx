'use client';

import { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {/* 콘텐츠 영역: currentSlide 사용 */}
        <div className="flex flex-col items-center pt-6 text-center">
          <div className="mb-6 flex h-48 w-full items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700">
            <img src={currentSlide.image} alt={currentSlide.title} className="h-full w-full object-contain p-4" />
          </div>
          <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{currentSlide.title}</h2>
          <p className="mb-8 h-12 text-sm text-gray-600 dark:text-gray-300">{currentSlide.description}</p>
        </div>

        {/* 하단 컨트롤 영역: ONBOARDING_SLIDES 배열 기반으로 인디케이터 생성 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 pl-2">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-4 bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentIndex > 0 && (
              <button onClick={handlePrev} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium dark:bg-gray-700">
                이전
              </button>
            )}
            <button
              onClick={isLastSlide ? closeModal : handleNext}
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              {isLastSlide ? '시작하기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
