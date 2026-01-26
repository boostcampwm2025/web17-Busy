import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 12)
  nickname: string;

  @IsString()
  @Length(255)
  bio: string;
}
