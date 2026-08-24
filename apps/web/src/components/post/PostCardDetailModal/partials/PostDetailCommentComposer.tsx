'use client';

import { Send } from 'lucide-react';
import { useAutoResizeTextarea } from '@/hooks';
import { handleEnterSubmitWithShiftNewline } from '@/utils';

type Props = {
  isAuthenticated: boolean;
  isSubmitting: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => Promise<void> | void;
};

export default function PostDetailCommentComposer({ isAuthenticated, isSubmitting, value, onChange, onSubmit }: Props) {
  const textareaRef = useAutoResizeTextarea(value, { maxHeightPx: 120 });

  return (
    <div className="p-4 border-t-2 border-primary flex items-end gap-3 bg-white">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={isAuthenticated ? '댓글 달기... (Enter 전송 / Shift+Enter 줄바꿈)' : '로그인 후 댓글을 작성할 수 있어요.'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) =>
          handleEnterSubmitWithShiftNewline(e, {
            onSubmit,
            disabled: !isAuthenticated || isSubmitting,
          })
        }
        disabled={!isAuthenticated || isSubmitting}
        className="flex-1 resize-none overflow-hidden py-2 px-3 text-sm font-medium rounded-xl border-2 border-primary/30
                   focus:outline-none focus:border-primary focus:ring-0 bg-background disabled:opacity-60"
      />

      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={!isAuthenticated || !value.trim() || isSubmitting}
        aria-busy={isSubmitting}
        title={isAuthenticated ? '전송' : '로그인 후 사용 가능'}
        className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-primary bg-primary text-white
                   hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}
