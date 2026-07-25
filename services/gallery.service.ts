import { Photo, Album } from '@/types/gallery';
import { mockPhotos, mockAlbums } from '@/mock/photos';

let memoryPhotos: Photo[] = [...mockPhotos];

export class GalleryService {
  static async getPhotos(): Promise<Photo[]> {
    // TODO: Replace with NestJS endpoint GET /api/photos
    return new Promise((resolve) => setTimeout(() => resolve(memoryPhotos), 200));
  }

  static async getAlbums(): Promise<Album[]> {
    // TODO: Replace with NestJS endpoint GET /api/albums
    return new Promise((resolve) => setTimeout(() => resolve(mockAlbums), 200));
  }

  static async addPhoto(photo: Omit<Photo, 'id'>): Promise<Photo> {
    // TODO: Replace with NestJS endpoint POST /api/photos
    const newPhoto: Photo = { ...photo, id: `photo_${Date.now()}` };
    memoryPhotos = [newPhoto, ...memoryPhotos];
    return newPhoto;
  }

  static async deletePhoto(id: string): Promise<boolean> {
    // TODO: Replace with NestJS endpoint DELETE /api/photos/:id
    memoryPhotos = memoryPhotos.filter((p) => p.id !== id);
    return true;
  }
}
