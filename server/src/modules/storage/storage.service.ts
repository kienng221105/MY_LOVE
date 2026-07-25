import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private publicDomain: string;

  constructor(private configService: ConfigService) {
    this.publicDomain =
      this.configService.get<string>('R2_PUBLIC_DOMAIN') ||
      'https://pub-r2.ourspace.app';
  }

  async uploadFile(file: Express.Multer.File) {
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const url = `${this.publicDomain}/${filename}`;

    this.logger.log(`Uploaded file to Cloudflare R2: ${filename}`);

    return {
      filename,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
