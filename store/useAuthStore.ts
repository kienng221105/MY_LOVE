import { create } from 'zustand';
import { User } from '@/types/auth';
import { mockUser } from '@/mock/user';
import { apiClient } from '@/services/api';

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  magicPhrase: string;
  login: (phrase: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => void;
  setMagicPhrase: (newPhrase: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: false,
  user: null,
  magicPhrase: '24122023',
  login: async (phrase: string) => {
    const inputClean = phrase.trim();

    // 1. Try Backend API (Neon PostgreSQL Cloud DB) first
    try {
      const res = await apiClient.post('/auth/login', { passcode: inputClean });
      if (res.data?.data?.accessToken) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ourspace_auth', 'true');
          localStorage.setItem('ourspace_token', res.data.data.accessToken);
          localStorage.setItem('ourspace_magic_phrase', inputClean);
        }
        set({ isAuthenticated: true, user: res.data.data.user || mockUser, magicPhrase: inputClean });
        return true;
      }
    } catch (e) {
      console.warn('API auth failed, checking local passcode fallback');
    }

    // 2. Fallback to LocalStorage / hardcoded default passcodes
    let customPhrase = '24122023';
    if (typeof window !== 'undefined') {
      customPhrase = localStorage.getItem('ourspace_magic_phrase') || '24122023';
    }

    const validPhrases = [customPhrase.toLowerCase(), '24122023', 'ourspace', 'love'];

    if (validPhrases.includes(inputClean.toLowerCase())) {
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
      localStorage.removeItem('ourspace_token');
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
  setMagicPhrase: async (newPhrase: string) => {
    const cleanPass = newPhrase.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('ourspace_magic_phrase', cleanPass);
    }
    set({ magicPhrase: cleanPass });

    // Sync new password to Neon Cloud DB
    try {
      await apiClient.post('/auth/change-password', {
        oldPasscode: get().magicPhrase || '24122023',
        newPasscode: cleanPass,
      });
    } catch (e) {
      console.warn('Could not sync password change to API backend');
    }
  },
}));
