import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateLikeDto {
  @IsNotEmpty()
  @IsUUID('all', { message: '유효한 Post ID가 아닙니다.' })
  postId: string;
}
