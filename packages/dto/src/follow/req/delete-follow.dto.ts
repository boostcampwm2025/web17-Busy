import { IsUUID, IsNotEmpty } from 'class-validator';

export class DeleteFollowDto {
  @IsNotEmpty()
  @IsUUID('all', { message: '유효한 Post ID가 아닙니다.' })
  otherUserId: string;
}
