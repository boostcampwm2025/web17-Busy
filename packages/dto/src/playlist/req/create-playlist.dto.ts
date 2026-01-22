import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePlaylistReqDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: '제목은 빈 문자열일 수 없습니다.' })
  @Length(1, 20)
  title?: string;
}
