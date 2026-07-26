import { create } from 'zustand';
import { User } from '@/types/auth';
import { mockUser } from '@/mock/user';
import { apiClient } from '@/services/api';
import { useIdentityStore, IdentityId } from '@/store/useIdentityStore';
import { resolveReactionBy } from '@/utils/reaction';

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  magicPhrase: string;
  login: (phrase: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => Promise<void>;
  setMagicPhrase: (newPhrase: string) => Promise<void>;
}

function persistUserName(name: string | undefined) {
  if (typeof window === 'undefined' || !name) return;
  try {
    localStorage.setItem('ourspace_user_name', name);
  } catch {}
}

/**
 * Nếu user chưa từng chọn identity thủ công, đặt mặc định theo user.name.
 * Nếu đã chọn rồi thì giữ nguyên (cho phép override).
 */
function suggestIdentityFromUser(name: string | undefined) {
  if (typeof window === 'undefined') return;
  try {
    const manualPicked = localStorage.getItem('ourspace_identity_manual');
    if (manualPicked === 'true') return;
    const id: IdentityId = resolveReactionBy(name || '');
    useIdentityStore.getState().setIdentity(id);
  } catch {}
}

function extractUser(payload: any): User | null {
  if (!payload || typeof payload !== 'object') return null;
  const anniversaryDate =
    typeof payload.anniversaryDate === 'string'
      ? new Date(payload.anniversaryDate).toISOString()
      : '2023-12-24T00:00:00.000Z';
  return {
    id: payload.id ?? mockUser.id,
    name: payload.name ?? mockUser.name,
    partnerName: payload.partnerName ?? mockUser.partnerName,
    anniversaryDate,
    avatarUrl: payload.avatarUrl ?? mockUser.avatarUrl,
    partnerAvatarUrl: payload.partnerAvatarUrl ?? mockUser.partnerAvatarUrl,
    timerVersion:
      typeof payload.timerVersion === 'number' ? payload.timerVersion : 0,
  };
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
      const data = res.data?.data;
      if (data?.accessToken) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ourspace_auth', 'true');
          localStorage.setItem('ourspace_token', data.accessToken);
          localStorage.setItem('ourspace_magic_phrase', inputClean);
        }
const safeUser = extractUser(data.user) ?? mockUser;
      set({ isAuthenticated: true, user: safeUser, magicPhrase: inputClean });
      persistUserName(safeUser.name);
      suggestIdentityFromUser(safeUser.name);
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
      persistUserName(mockUser.name);
      suggestIdentityFromUser(mockUser.name);
      return true;
    }
    return false;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ourspace_auth');
      localStorage.removeItem('ourspace_token');
      localStorage.removeItem('ourspace_app_data');
      localStorage.removeItem('ourspace_anniversary_date');
      localStorage.removeItem('ourspace_avatar_kien');
      localStorage.removeItem('ourspace_avatar_tra');
      localStorage.removeItem('ourspace_user_name');
      localStorage.removeItem('ourspace_identity_manual');
    }
    set({ isAuthenticated: false, user: null });
  },
  checkSession: async () => {
    if (typeof window === 'undefined') {
      set({ isAuthenticated: false, user: null });
      return;
    }
    const stored = localStorage.getItem('ourspace_auth');
    const storedPhrase = localStorage.getItem('ourspace_magic_phrase');
    if (storedPhrase) {
      set({ magicPhrase: storedPhrase });
    }

    if (stored !== 'true') {
      set({ isAuthenticated: false, user: null });
      return;
    }

    // Try to refresh from server so anniversary/avatar reflect backend state
    try {
      const res = await apiClient.get('/auth/me');
      const user = extractUser(res.data?.data) ?? mockUser;
      set({ isAuthenticated: true, user });
      persistUserName(user.name);
      suggestIdentityFromUser(user.name);
    } catch (err) {
      console.warn('Failed to refresh /auth/me, keeping offline session:', err);
      set({ isAuthenticated: true, user: mockUser });
      persistUserName(mockUser.name);
      suggestIdentityFromUser(mockUser.name);
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
        newPasscode: cleanPass,
      });
    } catch (e) {
      console.warn('Could not sync password change to API backend', e);
    }
  },
}));