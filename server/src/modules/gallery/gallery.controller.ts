import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Gallery & Albums')
@Public()
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('photos')
  @ApiOperation({ summary: 'Lấy danh sách hình ảnh kỷ niệm' })
  async getPhotos() {
    const data = await this.galleryService.getPhotos();
    return { message: 'Lấy danh sách ảnh thành công', data };
  }

  @Get('albums')
  @ApiOperation({ summary: 'Lấy danh sách Album kỷ niệm' })
  async getAlbums() {
    const data = await this.galleryService.getAlbums();
    return { message: 'Lấy danh sách album thành công', data };
  }

  @Post('photos')
  @ApiOperation({ summary: 'Thêm bức ảnh mới vào thư viện' })
  async addPhoto(@Body() dto: CreatePhotoDto) {
    const data = await this.galleryService.addPhoto(dto);
    return { message: 'Thêm ảnh mới thành công', data };
  }

  @Delete('photos/:id')
  @ApiOperation({ summary: 'Xóa bức ảnh khỏi thư viện' })
  async deletePhoto(@Param('id') id: string) {
    await this.galleryService.deletePhoto(id);
    return { message: 'Đã xóa bức ảnh khỏi Album', data: { success: true } };
  }
}
