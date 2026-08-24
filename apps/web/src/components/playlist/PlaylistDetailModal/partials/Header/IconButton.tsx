import type { ReactNode } from 'react';

type Props = {
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'danger';
  children: ReactNode;
};

/** 테두리와 여백은 고정이고 색만 갈리는 아이콘 버튼. */
export function IconButton({ label, onClick, tone = 'primary', children }: Props) {
  const toneClassName = tone === 'danger' ? 'text-accent-pink' : 'text-primary';

  return (
    <button type="button" aria-label={label} onClick={onClick} className={`p-1 rounded-md border-2 border-primary hover:bg-gray-50 ${toneClassName}`}>
      {children}
    </button>
  );
}
