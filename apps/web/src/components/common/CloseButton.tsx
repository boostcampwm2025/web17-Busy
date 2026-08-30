import { X } from 'lucide-react';

type Props = {
  onClose: () => void;
  size?: 'sm' | 'md';
  /** hover 시 아이콘이 accent-pink로 바뀐다. 로그인/글쓰기 헤더에서만 켠다. */
  accentOnHover?: boolean;
  label?: string;
};

const SIZE = {
  sm: { padding: 'p-2', icon: 'w-5 h-5' },
  md: { padding: 'p-1', icon: 'w-6 h-6' },
} as const;

/** 모달/시트 우측 상단 닫기(X) 버튼. */
export function CloseButton({ onClose, size = 'md', accentOnHover = false, label = '닫기' }: Props) {
  const { padding, icon } = SIZE[size];

  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      title={label}
      className={`${padding} rounded-full hover:bg-gray-4 transition-colors ${accentOnHover ? 'group' : ''}`}
    >
      <X className={`${icon} text-primary transition-colors ${accentOnHover ? 'group-hover:text-accent-pink' : ''}`} />
    </button>
  );
}
