import { internalClient } from './client';
import type { CreateCommentDto, GetCommentsResDto, UpdateCommentDto } from '@repo/dto';

type CreateCommentRes = { message: string; id: string };
type OkMessageRes = { message: string };

/** [GET] 작성된 댓글 목록 조회 */
export const getComments = async (postId: string): Promise<GetCommentsResDto> => {
  const { data } = await internalClient.get<GetCommentsResDto>('/comment', { params: { postId } });
  return data;
};

/** [POST] 댓글 생성  */
export const createComment = async (dto: CreateCommentDto): Promise<CreateCommentRes> => {
  const { data } = await internalClient.post<CreateCommentRes>('/comment', dto);
  return data;
};

/** [PATCH] 댓글 수정  */
export const updateComment = async (commentId: string, dto: UpdateCommentDto): Promise<OkMessageRes> => {
  const { data } = await internalClient.patch<OkMessageRes>(`/comment/${commentId}`, dto);
  return data;
};

/** [DELETE] 댓글 삭제  */
export const deleteComment = async (commentId: string): Promise<OkMessageRes> => {
  const { data } = await internalClient.delete<OkMessageRes>(`/comment/${commentId}`);
  return data;
};
