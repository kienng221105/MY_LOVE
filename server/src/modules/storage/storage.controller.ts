import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Tải 1 file ảnh lên Cloudflare R2 / S3 Storage' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    const data = await this.storageService.uploadFile(file);
    return {
      message: 'Tải ảnh lên thành công',
      data,
    };
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Tải nhiều file ảnh lên Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map((file) => this.storageService.uploadFile(file))
    );
    return {
      message: `Đã tải lên ${results.length} tệp ảnh thành công`,
      data: results,
    };
  }
}
