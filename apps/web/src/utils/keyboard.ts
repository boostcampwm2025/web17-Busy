import type React from 'react';

type Options = {
  /** Enter 단독 전송 핸들러 */
  onSubmit: () => void | Promise<void>;
  /** 비활성화 상태면 아무것도 하지 않음 */
  disabled?: boolean;
};

/**
 * 슬랙-스타일 input handler
 * - Enter: submit
 * - Shift+Enter: newline (default)
 * - IME composing 중 Enter는 무시 (한글 조합 확정용)
 */
export const handleEnterSubmitWithShiftNewline = (e: React.KeyboardEvent<HTMLTextAreaElement>, { onSubmit, disabled = false }: Options) => {
  if (disabled) return;

  const native = e.nativeEvent as unknown as { isComposing?: boolean };
  if (native?.isComposing) return;

  if (e.key !== 'Enter') return;
  if (e.shiftKey) return; // 줄바꿈은 기본 동작

  e.preventDefault();
  e.stopPropagation();
  void onSubmit();
};
