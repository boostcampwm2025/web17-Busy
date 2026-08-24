import type { MouseEvent, ReactNode } from 'react';

import { LAYER, type Layer } from '@/constants/layers';

/** 카드 최대 너비. 화면마다 다른 높이는 cardClassName으로 받는다. */
const SIZE = {
  sm: 'max-w-sm md:max-w-md',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const;

type Props = {
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof SIZE;
  layer?: Layer;
  /** 배경을 눌러 닫을지. 작성 중 내용이 날아가면 곤란한 화면은 false로 둔다. */
  closeOnBackdrop?: boolean;
  /** 높이 제약처럼 화면마다 다른 것만 넘긴다. 예: 'max-h-[85vh]' */
  cardClassName?: string;
};

/**
 * 모달의 배경과 카드. 배경·테두리·그림자·애니메이션과 배경 클릭 닫기를 여기서 한 번에 정한다.
 *
 * click이 아니라 mousedown으로 닫는 이유: 카드 안에서 드래그를 시작해 배경에서 손을 떼면
 * click은 배경에서 발생한 것으로 잡혀, 텍스트를 선택하다 모달이 닫힌다.
 */
export function ModalShell({ onClose, children, size = 'md', layer = 'modal', closeOnBackdrop = true, cardClassName = '' }: Props) {
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`fixed inset-0 ${LAYER[layer]} flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-fade-in`}
      onMouseDown={handleMouseDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-white w-full ${SIZE[size]} rounded-3xl border-2 border-primary shadow-[8px_8px_0px_0px_var(--color-primary)] flex flex-col overflow-hidden animate-scale-up ${cardClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
