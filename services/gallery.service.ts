import { apiClient } from './api';
import { Photo, Album } from '@/types/gallery';

export class GalleryService {
  static async getPhotos(): Promise<Photo[]> {
    try {
      const res = await apiClient.get('/gallery/photos');
      return res.data?.data || [];
    } catch {
      return [];
    }
  }

  static async getAlbums(): Promise<Album[]> {
    try {
      const res = await apiClient.get('/gallery/albums');
      return res.data?.data || [];
    } catch {
      return [];
    }
  }

  static async addPhoto(photo: Omit<Photo, 'id'>): Promise<Photo | null> {
    try {
      const res = await apiClient.post('/gallery/photos', photo);
      return res.data?.data || null;
    } catch {
      return null;
    }
  }

  static async deletePhoto(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/gallery/photos/${id}`);
      return true;
    } catch {
      return false;
    }
  }
}
