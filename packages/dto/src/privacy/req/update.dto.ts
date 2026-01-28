import { IsBoolean, IsEnum, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS',
  PRIVACY_POLICY = 'PRIVACY',
}

export class ConsentItemDto {
  @IsNotEmpty()
  @IsEnum(ConsentType, { message: '유효하지 않은 약관 타입입니다.' })
  type: ConsentType;

  @IsNotEmpty()
  @IsBoolean()
  agreed: boolean;
}

export class UpdateConsentListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsentItemDto)
  items: ConsentItemDto[];
}
