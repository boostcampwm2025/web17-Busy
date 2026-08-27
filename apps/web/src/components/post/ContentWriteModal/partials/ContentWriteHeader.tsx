import { X } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export const ContentWriteHeader = ({ onClose }: Props) => (
  <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
    <h2 className="text-xl font-black text-primary">새 게시물 만들기</h2>
    <button type="button" onClick={onClose} className="p-1 hover:bg-gray-4 rounded-full transition-colors group" aria-label="close">
      <X className="w-6 h-6 text-primary group-hover:text-accent-pink transition-colors" />
    </button>
  </div>
);
