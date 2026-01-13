import { IsString, IsNotEmpty, IsEnum, IsUrl, IsInt, Min } from 'class-validator';
import { MusicProvider } from '../music-provider.enum';

export class CreateMusicReqDto {
  @IsString()
  @IsNotEmpty()
  trackUri: string;

  @IsEnum(MusicProvider)
  @IsNotEmpty()
  provider: MusicProvider;

  @IsUrl()
  @IsNotEmpty()
  albumCoverUrl: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  artistName: string;

  @IsInt()
  @Min(0)
  durationMs: number;
}
