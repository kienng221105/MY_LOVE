import { create } from 'zustand';

export type IdentityId = 'Kien' | 'Love';

export interface IdentityInfo {
  id: IdentityId;
  displayName: string;
  shortLabel: string;
  emoji: string;
  color: 'blue' | 'pink';
}

export const IDENTITIES: Record<IdentityId, IdentityInfo> = {
  Kien: {
    id: 'Kien',
    displayName: 'Kiên',
    shortLabel: 'K',
    emoji: '♂',
    color: 'blue',
  },
  Love: {
    id: 'Love',
    displayName: 'Trà',
    shortLabel: 'T',
    emoji: '♀',
    color: 'pink',
  },
};

const STORAGE_KEY = 'ourspace_identity';

function loadInitialIdentity(): IdentityId {
  if (typeof window === 'undefined') return 'Kien';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'Kien' || stored === 'Love') return stored;
  } catch {}
  return 'Kien';
}

interface IdentityStore {
  identity: IdentityId;
  setIdentity: (id: IdentityId) => void;
  toggleIdentity: () => void;
}

export const useIdentityStore = create<IdentityStore>((set) => ({
  identity: typeof window === 'undefined' ? 'Kien' : loadInitialIdentity(),
  setIdentity: (id) => {
    set({ identity: id });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, id);
        localStorage.setItem('ourspace_identity_manual', 'true');
      } catch {}
    }
  },
  toggleIdentity: () => {
    set((state) => {
      const next: IdentityId = state.identity === 'Kien' ? 'Love' : 'Kien';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, next);
          localStorage.setItem('ourspace_identity_manual', 'true');
        } catch {}
      }
      return { identity: next };
    });
  },
}));

export function getActiveIdentity(): IdentityId {
  return loadInitialIdentity();
}