import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v7 as uuidV7 } from 'uuid';

@Injectable()
export class UploadService {
  private s3Client: S3Client;
  private readonly bucketName = process.env.NCP_BUCKET_NAME;

  constructor() {
    this.s3Client = new S3Client({
      region: 'kr-standard',
      endpoint: 'https://kr.object.ncloudstorage.com',
      credentials: {
        accessKeyId: process.env.NCP_ACCESS_KEY!,
        secretAccessKey: process.env.NCP_SECRET_KEY!,
      },
    });
  }

  async uploadPostImage(file: Express.Multer.File): Promise<string> {
    try {
      const imageBuffer = await this.transformImage(file.buffer);
      const fileName = `posts/${uuidV7()}.jpeg`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: imageBuffer,
          ACL: 'public-read',
          ContentType: 'image/jpeg',
        }),
      );

      return `https://kr.object.ncloudstorage.com/${this.bucketName}/${fileName}`;
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
