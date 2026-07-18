import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v7 as uuidV7 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private readonly bucketName = process.env.AWS_S3_BUCKET_NAME;
  private readonly region = process.env.AWS_REGION ?? 'ap-northeast-2';

  constructor() {
    // 자격증명은 SDK 기본 체인이 해결: 로컬은 env 키, EC2(프로덕션)는 인스턴스 IAM 롤
    this.s3Client = new S3Client({ region: this.region });
  }

  async uploadPostImage(file: Express.Multer.File): Promise<string> {
    try {
      const imageBuffer = await this.transformImage(file.buffer);
      const fileName = `posts/${uuidV7()}.jpeg`;

      // 퍼블릭 read는 버킷 정책(bucket policy)으로 처리 — 최신 S3 버킷은 ACL이 비활성(Bucket owner enforced)이라 ACL 미사용
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: imageBuffer,
          ContentType: 'image/jpeg',
        }),
      );

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error('Image Upload Error:', error);
      throw new InternalServerErrorException('이미지 업로드에 실패했습니다.');
    }
  }

  // 이미지가 500x500보다 크면 -> 500x500으로 리사이징, 포맷 jpeg로 변환
  private async transformImage(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (
      (metadata.width && metadata.width > 500) ||
      (metadata.height && metadata.height > 500)
    ) {
      return image
        .resize(500, 500, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat('jpeg')
        .toBuffer();
    }

    return image.toFormat('jpeg').toBuffer();
  }
}
