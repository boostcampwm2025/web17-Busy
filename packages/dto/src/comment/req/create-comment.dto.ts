import { IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsUUID('all', { message: '유효한 Post ID가 아닙니다.' })
  postId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2300, { message: '댓글은 최대 2300자까지 작성할 수 있습니다.' })
  content: string;
}
