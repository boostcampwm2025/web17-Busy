import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Min } from 'class-validator';
import { MusicProvider } from './music-provider.enum';

export class MusicBaseDto {
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

export class MusicRequestDto extends MusicBaseDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}

export class MusicResponseDto extends MusicBaseDto {
  id: string;
}
