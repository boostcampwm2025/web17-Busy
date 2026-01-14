import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class UploadService {
  // 실제 디스크 저장 루트
  readonly uploadRoot = join(process.cwd(), 'uploads');

  // 브라우저에서 접근할 공개 URL prefix
  readonly publicPrefix = '/uploads';

  toPublicUrl(filename: string) {
    return `${this.publicPrefix}/${filename}`;
  }
}
