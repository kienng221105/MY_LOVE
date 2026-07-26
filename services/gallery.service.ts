import { apiClient } from './api';
import { Photo, Album } from '@/types/gallery';

export class GalleryApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GalleryApiError';
    this.status = status;
  }
}

function unwrapError(err: any, fallback: string): never {
  const status = err?.response?.status;
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0] ||
    err?.message ||
    fallback;
  throw new GalleryApiError(
    Array.isArray(message) ? message[0] : message,
    status
  );
}

export class GalleryService {
  static async getPhotos(): Promise<Photo[]> {
    try {
      const res = await apiClient.get('/gallery/photos');
      return res.data?.data || [];
    } catch (err) {
      unwrapError(err, 'Không tải được album ảnh');
    }
  }

  static async getAlbums(): Promise<Album[]> {
    try {
      const res = await apiClient.get('/gallery/albums');
      return res.data?.data || [];
    } catch (err) {
      unwrapError(err, 'Không tải được danh sách album');
    }
  }

  static async addPhoto(photo: Omit<Photo, 'id'>): Promise<Photo> {
    try {
      const res = await apiClient.post('/gallery/photos', photo);
      if (!res.data?.data) {
        throw new GalleryApiError('Phản hồi lưu ảnh không hợp lệ');
      }
      return res.data.data;
    } catch (err) {
      unwrapError(err, 'Không lưu được ảnh, vui lòng thử lại');
    }
  }

  static async deletePhoto(id: string): Promise<void> {
    try {
      await apiClient.delete(`/gallery/photos/${id}`);
    } catch (err) {
      unwrapError(err, 'Không xóa được ảnh');
    }
  }
}