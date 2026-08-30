import { CloseButton } from '@/components/common/CloseButton';

type Props = {
  onClose: () => void;
};

export const ContentWriteHeader = ({ onClose }: Props) => (
  <div className="flex items-center justify-between px-6 py-4 border-b-2 border-primary bg-white z-10 shrink-0">
    <h2 className="text-xl font-black text-primary">새 게시물 만들기</h2>
    <CloseButton onClose={onClose} accentOnHover />
  </div>
);
