import { ReactionSummary } from './reaction';

export type MoodType =
  | 'happy'
  | 'romantic'
  | 'cozy'
  | 'miss_you'
  | 'excited'
  | 'proud'
  | 'grateful'
  | 'playful'
  | 'tired'
  | 'thoughtful'
  | 'anxious'
  | 'heartbroken';

export type WeatherType =
  | 'sunny'
  | 'rainy'
  | 'starry'
  | 'cloudy'
  | 'partly_cloudy'
  | 'snowy'
  | 'windy'
  | 'thunder'
  | 'foggy'
  | 'rainbow';

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
  reactions?: ReactionSummary;
}