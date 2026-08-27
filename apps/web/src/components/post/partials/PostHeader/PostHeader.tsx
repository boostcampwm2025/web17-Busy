import { toast } from 'react-toastify';
import type { PostResponseDto } from '@repo/dto';

import ConfirmOverlay from '@/components/common/ConfirmOverlay';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { useConfirm } from '@/hooks/common/use-confirm';
import { useDeletePostMutation } from '@/hooks/post/use-post-mutations';
import { coalesceImageSrc } from '@/utils/image';
import { formatRelativeTime } from '@/utils/time';

import PostOwnerMenu from './PostOwnerMenu';

type Props = {
  post: PostResponseDto;
  isOwner: boolean;
  onUserClick: (userId: string) => void;
  onEditPost?: () => void;
  onDeletePost?: () => void;
};

export default function PostHeader({ post, isOwner, onUserClick, onEditPost, onDeletePost }: Props) {
  const deletePostMutation = useDeletePostMutation({ postId: post.id, onDeleted: onDeletePost });

  const deleteConfirm = useConfirm(() =>
    deletePostMutation.mutate(undefined, {
      onSuccess: () => toast.success('삭제했습니다.'),
      onError: () => toast.error('삭제 실패! 다시 시도해주세요.'),
    }),
  );

  const handleUser = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onUserClick(post.author.id);
  };

  const profileImg = coalesceImageSrc(post.author.profileImgUrl, DEFAULT_IMAGES.PROFILE);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3 cursor-pointer group min-w-0" onClick={handleUser}>
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-100 shrink-0 group-hover:ring-2 ring-accent-cyan transition-all">
          <img src={profileImg} alt={post.author.nickname} className="w-full h-full object-cover" />
        </div>

        <div className="min-w-0">
          <h3 className="font-bold lg:text-lg leading-none truncate group-hover:text-accent-pink transition-colors">{post.author.nickname}</h3>
          <span className="text-xs text-gray-500 font-medium">{formatRelativeTime(post.createdAt)}</span>
        </div>
      </div>

      {isOwner && <PostOwnerMenu onEdit={() => onEditPost?.()} onDelete={deleteConfirm.open} />}

      <ConfirmOverlay open={deleteConfirm.isOpen} title="게시글을 삭제할까요?" onCancel={deleteConfirm.cancel} onConfirm={deleteConfirm.confirm} />
    </div>
  );
}
