import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class UpdateMusicsOrderOfPlaylistReqDto {
  @IsArray()
  @IsUUID('7', { each: true })
  musicIds: string[];
}
