import { ReactionSummary } from './reaction';

export interface LoveLetter {
  id: string;
  sender: string;
  recipient: string;
  title: string;
  content: string;
  sentDate: string;
  openDate?: string; // If set in the future, letter is sealed until this date
  isRead: boolean;
  isFavorite?: boolean;
  isDraft?: boolean;
  bgStyle?: 'pink' | 'lavender' | 'mint';
  reactions?: ReactionSummary;
}