import { IsString, MaxLength, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 12)
  nickname: string;

  @IsString()
  @MaxLength(255)
  bio: string;
}
