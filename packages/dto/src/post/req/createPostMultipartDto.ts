import { IsJSON, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostMultipartDto {
  @IsOptional()
  @IsString()
  content?: string;

  // musics: MusicRequest[] 를 "문자열"로 받는다 (JSON string)
  @IsString()
  @IsNotEmpty()
  @IsJSON()
  musics: string;
}
