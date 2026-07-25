export interface MemoryMilestone {
  id: string;
  title: string;
  date: string;
  description: string;
  location?: string;
  category: 'first_meet' | 'travel' | 'anniversary' | 'date_night' | 'special';
  imageUrl?: string;
  imageUrls?: string[];
  isFavorite?: boolean;
}
