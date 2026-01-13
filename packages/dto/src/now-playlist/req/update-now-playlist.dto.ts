import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class UpdateNowPlaylistReqDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  musicIds: string[];
}
