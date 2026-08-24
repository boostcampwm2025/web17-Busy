'use client';

import { useCallback, useState } from 'react';

/**
 * 확인을 받고 실행하는 동작의 열림 상태.
 * cancel 참조를 고정하는 이유: ConfirmOverlay가 onCancel을 effect 의존성으로 쓰므로,
 * 호출부가 인라인 화살표를 넘기면 렌더마다 document mousedown 리스너가 다시 붙는다.
 */
export const useConfirm = (onConfirm: () => void) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const cancel = useCallback(() => setIsOpen(false), []);

  const confirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  return { isOpen, open, cancel, confirm };
};
