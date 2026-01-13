import { IsString, IsNotEmpty, IsEnum, IsUrl, IsInt, Min } from 'class-validator';
import { Provider } from '../music-provider.enum';

export class CreateMusicReqDto {
  @IsString()
  @IsNotEmpty()
  trackUri: string;

  @IsEnum(Provider)
  @IsNotEmpty()
  provider: Provider;

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
