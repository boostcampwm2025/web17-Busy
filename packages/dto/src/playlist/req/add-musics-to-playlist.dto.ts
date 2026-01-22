import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { MusicRequestDto } from '../../music';

export class AddMusicsToPlaylistReqDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MusicRequestDto)
  musics: MusicRequestDto[];
}
