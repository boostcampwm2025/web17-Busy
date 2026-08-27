import { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { useOutsideClick } from '@/hooks/common/use-outside-click';

type Props = {
  onEdit: () => void;
  onDelete: () => void;
};

/** 작성자에게만 보이는 수정·삭제 드롭다운. */
export default function PostOwnerMenu({ onEdit, onDelete }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // 메뉴 항목이 click으로 동작하므로 mousedown으로 닫으면 항목 클릭이 먹히지 않는다.
  useOutsideClick([menuRef, buttonRef], () => setIsOpen(false), { enabled: isOpen, eventType: 'click' });

  const runAndClose = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    action();
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`text-gray-400 p-2 hover:text-primary transition-colors ${isOpen ? 'text-primary' : ''}`}
        title="더보기"
      >
        <MoreHorizontal className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 bg-white border border-primary rounded-lg overflow-hidden min-w-24 z-30 animate-in fade-in zoom-in duration-200"
        >
          <button
            type="button"
            onClick={runAndClose(onEdit)}
            className="block w-full px-4 py-2.5 text-sm text-blue-500 font-bold border-b border-gray-3 hover:bg-blue-50 transition-colors text-left"
          >
            수정하기
          </button>
          <button
            type="button"
            onClick={runAndClose(onDelete)}
            className="block w-full px-4 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 transition-colors text-left"
          >
            삭제하기
          </button>
        </div>
      )}
    </div>
  );
}
