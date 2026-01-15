import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetCommentsReqDto {
  @IsNotEmpty()
  @IsUUID('all', { message: '유효한 Post ID가 아닙니다.' })
  postId: string;
}
