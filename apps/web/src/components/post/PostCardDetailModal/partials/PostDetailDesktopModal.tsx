import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import PostHeader from '@/components/post/partials/PostHeader';
import PostMedia from '@/components/post/partials/PostMedia';
import { LAYER } from '@/constants/layers';
import type { PostEditing } from '@/hooks/post/use-post-editing';
import type { PostReactions } from '@/hooks/post/usePostReactions';

import PostContentEditor from './PostContentEditor';
import PostDetailActions from './PostDetailActions';
import PostDetailBody from './PostDetailBody';
import PostDetailCommentComposer from './PostDetailCommentComposer';

type Props = {
  post: Post;
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;
  onPlay: (music: Music) => void;
  onPlayAll: () => void;

  reactions: PostReactions;
  editing: PostEditing;

  onClose: () => void;
  onUserClick: () => void;
  onOpenLikedUsers: () => void;
};

/** 데스크탑 풀 모달. 모바일 바텀시트와 동시에 그려지지 않는다. */
export default function PostDetailDesktopModal({
  post,
  isOwner,
  isLoading,
  error,
  currentMusicId,
  isPlayingGlobal,
  onPlay,
  onPlayAll,
  reactions,
  editing,
  onClose,
  onUserClick,
  onOpenLikedUsers,
}: Props) {
  const { comments, commentsLoading, isAuthenticated, isSubmittingComment, isSubmittingLike, isLiked, likeCount, commentText } = reactions;
  const { setCommentText, submitComment, toggleLike } = reactions;
  const { isEditing, editedContent, isSaving, isSaveDisabled, setEditedContent } = editing;
  const { handleStartEdit, handleSave, handleCancelEdit } = editing;

  return (
    <div
      className={`hidden lg:flex fixed inset-0 ${LAYER.modal} items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex-1 flex items-center justify-center bg-gray-4">
            <div className="text-sm font-bold text-gray-500">{error}</div>
          </div>
        ) : (
          <PostMedia
            post={post}
            variant="modal"
            currentMusicId={currentMusicId}
            isPlayingGlobal={isPlayingGlobal}
            onPlay={onPlay}
            onPlayAll={onPlayAll}
          />
        )}

        <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary flex-1 min-h-0">
          <div className="mt-4 px-4 py-2 border-b-2 border-primary/10">
            <PostHeader
              post={post}
              isOwner={isOwner}
              onUserClick={onUserClick}
              onEditPost={isOwner ? handleStartEdit : undefined}
              onDeletePost={isOwner ? onClose : undefined}
            />
          </div>

          {isEditing ? (
            <PostContentEditor
              value={editedContent}
              isSaving={isSaving}
              isSaveDisabled={isSaveDisabled}
              onChange={setEditedContent}
              onSave={handleSave}
              onCancel={handleCancelEdit}
            />
          ) : (
            <PostDetailBody author={post.author} content={post.content} comments={comments} commentsLoading={commentsLoading} />
          )}

          <PostDetailActions
            isAuthenticated={isAuthenticated}
            isSubmitting={isSubmittingLike}
            isLiked={isLiked}
            likeCount={likeCount}
            postId={post.id}
            onToggleLike={toggleLike}
            onOpenLikedUsers={onOpenLikedUsers}
          />
          <PostDetailCommentComposer
            isAuthenticated={isAuthenticated}
            isSubmitting={isSubmittingComment}
            value={commentText}
            onChange={setCommentText}
            onSubmit={submitComment}
          />
        </div>
      </div>
    </div>
  );
}
