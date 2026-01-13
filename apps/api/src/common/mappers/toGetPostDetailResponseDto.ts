import { GetPostDetailResponseDto } from '@repo/dto/post/res/getPostDetailResponseDto';
import { MusicResponse } from '@repo/dto/post/res/shared';
import { Post } from 'src/modules/post/entities/post.entity';

export function toGetPostDetailResponseDto({
  post,
  musics,
  isLiked,
}: {
  post: Post;
  musics: MusicResponse[];
  isLiked: boolean;
}): GetPostDetailResponseDto {
  const { id: userId, nickname, profileImgUrl } = post.author;
  const {
    id: postId,
    thumbnailImgUrl,
    content,
    likeCount,
    commentCount,
    createdAt,
    updatedAt,
  } = post;

  // 차이가 1초 이상이면 수정된 것으로 판단
  const isEdited = updatedAt.getTime() - createdAt.getTime() >= 1000;

  return {
    postId,
    author: { userId, nickname, profileImgUrl },
    thumbnailImgUrl,
    musics,
    content,
    likeCount,
    commentCount,
    createdAt,
    isEdited,
    isLiked,
  };
}
