export type MoodType = 'happy' | 'romantic' | 'cozy' | 'miss_you';
export type WeatherType = 'sunny' | 'rainy' | 'starry' | 'cloudy';

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: MoodType;
  weather: WeatherType;
  imageUrls?: string[];
  author: 'Kien' | 'Love';
  isDraft?: boolean;
}
