import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2300, { message: '댓글은 최대 2300자까지 작성할 수 있습니다.' })
  content: string;
}
