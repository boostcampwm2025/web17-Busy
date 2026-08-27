import { X } from 'lucide-react';
import type { PostResponseDto as Post } from '@repo/dto';

import { LAYER } from '@/constants/layers';
import type { useSwipeToDismiss } from '@/hooks/common/useSwipeToDismiss';
import type { PostReactions } from '@/hooks/post/usePostReactions';

import PostDetailBody from './PostDetailBody';
import PostDetailCommentComposer from './PostDetailCommentComposer';

type Props = {
  post: Post;
  reactions: PostReactions;
  swipe: ReturnType<typeof useSwipeToDismiss>;
  onClose: () => void;
};

/** 모바일에서는 상세 전체가 아니라 댓글 바텀시트만 띄운다. 데스크탑 레이아웃과 동시에 그려지지 않는다. */
export default function PostDetailMobileSheet({ post, reactions, swipe, onClose }: Props) {
  return (
    <div className="lg:hidden">
      {/* 시트는 같은 층이지만 DOM에서 뒤에 오므로 이 배경 위에 그려진다. */}
      <div className={`fixed inset-0 ${LAYER.modal} bg-black/60 backdrop-blur-sm animate-fade-in`} onClick={onClose} />

      <section
        ref={swipe.sheetRef}
        className={`fixed inset-x-0 bottom-0 ${LAYER.modal} h-[90vh] bg-white rounded-t-2xl border-t-2 border-x-2 border-primary flex flex-col animate-slide-up`}
        onTouchStart={swipe.handleTouchStart}
        onTouchMove={swipe.handleTouchMove}
        onTouchEnd={swipe.handleTouchEnd}
      >
        {/* 핸들 + 닫기 버튼 */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-gray-3" />
          <div className="flex-1 flex justify-end">
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors" title="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <PostDetailBody author={post.author} content={post.content} comments={reactions.comments} commentsLoading={reactions.commentsLoading} />

        <PostDetailCommentComposer
          isAuthenticated={reactions.isAuthenticated}
          isSubmitting={reactions.isSubmittingComment}
          value={reactions.commentText}
          onChange={reactions.setCommentText}
          onSubmit={reactions.submitComment}
        />
      </section>
    </div>
  );
}
