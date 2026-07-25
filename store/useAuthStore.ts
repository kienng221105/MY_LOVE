import { create } from 'zustand';
import { User } from '@/types/auth';
import { mockUser } from '@/mock/user';

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  magicPhrase: string;
  login: (phrase: string) => boolean;
  logout: () => void;
  checkSession: () => void;
  setMagicPhrase: (newPhrase: string) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  magicPhrase: '24122023',
  login: (phrase: string) => {
    let customPhrase = '24122023';
    if (typeof window !== 'undefined') {
      customPhrase = localStorage.getItem('ourspace_magic_phrase') || '24122023';
    }

    const inputClean = phrase.trim().toLowerCase();
    const validPhrases = [customPhrase.toLowerCase(), '24122023', 'ourspace', 'love'];

    if (validPhrases.includes(inputClean)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ourspace_auth', 'true');
      }
      set({ isAuthenticated: true, user: mockUser });
      return true;
    }
    return false;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ourspace_auth');
    }
    set({ isAuthenticated: false, user: null });
  },
  checkSession: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ourspace_auth');
      const storedPhrase = localStorage.getItem('ourspace_magic_phrase');
      if (storedPhrase) {
        set({ magicPhrase: storedPhrase });
      }
      if (stored === 'true') {
        set({ isAuthenticated: true, user: mockUser });
      } else {
        set({ isAuthenticated: false, user: null });
      }
    }
  },
  setMagicPhrase: (newPhrase: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ourspace_magic_phrase', newPhrase.trim());
    }
    set({ magicPhrase: newPhrase.trim() });
  },
}));
